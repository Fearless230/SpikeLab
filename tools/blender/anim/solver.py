"""Motion solver for the volleyball player rig.

Clip parameters (pelvis path, trunk angles, arm angles, foot plants) -> world rotation of every bone, per frame.
Conventions (clip space): +x toward the net, +y up, +z the player's right; s = -1 left side, +1 right side.
Arm angles follow the original athlete.js rig so existing choreography carries over:
  arm = [flex, horizontal abduction, humeral twist, elbow flex, wrist flex, pronation, finger curl]
Rest pose of the mesh is the MakeHuman A-pose; every limb segment is mapped from its rest frame to a canonical frame
(arm hanging, palm forward, elbow axis +z), so the angles mean the same thing on this mesh as on the old rig."""
import os, numpy as np, math, sys, json, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if os.path.basename(os.path.dirname(os.path.abspath(__file__))) == 'anim' else os.path.dirname(os.path.abspath(__file__)))
D2R = math.pi / 180

def Rx(a): c, s = math.cos(a), math.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def Ry(a): c, s = math.cos(a), math.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def Rz(a): c, s = math.cos(a), math.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def Rax(axis, a):
    axis = axis / np.linalg.norm(axis); x, y, z = axis; c, s = math.cos(a), math.sin(a); C = 1 - c
    return np.array([[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]])
def nrm(v): l = np.linalg.norm(v); return v / l if l > 1e-12 else v
def frame(u, n):
    u = nrm(u); n = nrm(n - u * (n @ u)); return np.stack([u, n, np.cross(u, n)], 1)
def smoothstep(e0, e1, x):
    t = min(1, max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
CAN = frame(np.array([0., -1, 0]), np.array([0., 0, 1]))          # canonical hanging limb, flex axis +z

class Rig:
    def __init__(self, B=None):
        if B is None:
            import char_parts as CP
            B = CP.Builder()
        from char_geo_head import BNAME, BPAR, joint_pos
        self.names, self.par = BNAME, BPAR
        H, T = B.joints['athletic']; self.H, self.T = H.copy(), T.copy()
        self.i = {n: k for k, n in enumerate(BNAME)}
        h = lambda n: self.H[self.i[n]]; t = lambda n: self.T[self.i[n]]
        self.h, self.t = h, t
        self.seg = {}
        for s, S in ((-1, 'L'), (1, 'R')):
            ua = h(f'forearm.{S}') - h(f'upperarm.{S}'); fa = h(f'hand.{S}') - h(f'forearm.{S}')
            n0 = nrm(np.cross(nrm(ua), nrm(fa)))
            self.seg[f'upperarm.{S}'] = frame(ua, n0); self.seg[f'forearm.{S}'] = frame(fa, n0)
            # hand: wrist flex axis along the knuckle line, signed so it matches the elbow axis with the palm forward
            idx = joint_pos(B.P, B.sk, f'finger2-1.{S}____head'); pk = joint_pos(B.P, B.sk, f'finger5-1.{S}____head')
            w = s * nrm(idx - pk); hd = t(f'hand.{S}') - h(f'hand.{S}')
            self.seg[f'hand.{S}'] = frame(hd, w)
            th = t(f'shin.{S}') - h(f'shin.{S}'); tg = t(f'thigh.{S}') - h(f'thigh.{S}')
            self.seg[f'thigh.{S}'] = frame(tg, np.array([0, 0, -1.])); self.seg[f'shin.{S}'] = frame(th, np.array([0, 0, -1.]))
            self.L1 = np.linalg.norm(tg); self.L2 = np.linalg.norm(th)
        # foot geometry: ball of the foot (toe joint) on the ground, ankle above and behind it, heel under the ankle
        a0 = h('foot.R'); b0 = h('toe.R'); self.ankle_from_ball = a0 - np.array([b0[0], 0, b0[2]])
        self.heel_from_ball = np.array([a0[0] - .045 - b0[0], 0, 0]) + np.array([0, 0, a0[2] - b0[2]])
        self.hipw = abs(h('thigh.R')[2] - h('hips')[2])
        self.stand = h('hips')[1]
        self.ankle_h = a0[1]

    # ---------- forward kinematics ----------
    def solve(self, P):
        """P: pose params. Returns R (nb,3,3) world rotations, X (nb,3) world head positions."""
        nb = len(self.names); R = np.zeros((nb, 3, 3)); X = np.zeros((nb, 3)); i = self.i
        def put(n, Rw):
            k = i[n]; R[k] = Rw; p = self.par[k]
            X[k] = X[p] + R[p] @ (self.H[k] - self.H[p]) if p >= 0 else P['pos']
        Rp = Ry(P['yaw'] * D2R) @ Rz(-P['lean'] * D2R) @ Rx(P['side'] * D2R)
        put('hips', Rp)
        F = P['crunch'] - P['arch']; Tw = P['twist']; S = P['side2']
        Rs1 = Rp @ Ry(Tw * .25 * D2R) @ Rz(-F * .40 * D2R) @ Rx(S * .35 * D2R); put('spine1', Rs1)
        Rs2 = Rs1 @ Ry(Tw * .35 * D2R) @ Rz(-F * .35 * D2R) @ Rx(S * .35 * D2R); put('spine2', Rs2)
        Rc = Rs2 @ Ry(Tw * .40 * D2R) @ Rz(-F * .25 * D2R) @ Rx(S * .30 * D2R); put('chest', Rc)
        Rn = Rc @ Ry(P['hy'] * .3 * D2R) @ Rz(-P['hp'] * .35 * D2R); put('neck', Rn)
        Rh = Rn @ Ry(P['hy'] * .7 * D2R) @ Rz(-P['hp'] * .65 * D2R) @ Rx(P.get('hr', 0) * D2R); put('head', Rh)
        put('jaw', Rh @ Rz(P.get('jaw', 0) * D2R))
        for s, Sd in ((-1, 'L'), (1, 'R')):
            fl, ha, tw, el, wr, pr, cu = P['arm'][Sd]
            A = Ry(-s * ha * D2R) @ Rz(fl * D2R) @ Ry(s * tw * D2R)
            down = A @ np.array([0, -1., 0])
            elev = math.degrees(math.acos(max(-1, min(1, -down[1]))))
            fwd = down[0]
            cl_e = .26 * max(0, elev - 45) + P.get('shrug', 0)
            cl_p = 10 * max(0, fwd) - 6 * max(0, -fwd) + .1 * min(0, -ha)
            Rcl = Rc @ Rx(-s * cl_e * D2R) @ Ry(s * cl_p * D2R); put(f'clavicle.{Sd}', Rcl)
            Rua = Rc @ A @ CAN @ self.seg[f'upperarm.{Sd}'].T; put(f'upperarm.{Sd}', Rua)
            E = Rc @ A @ Rz(el * D2R)
            Rfa = E @ CAN @ self.seg[f'forearm.{Sd}'].T; put(f'forearm.{Sd}', Rfa)
            Rhd = E @ Ry(s * pr * D2R) @ Rz(wr * D2R) @ CAN @ self.seg[f'hand.{Sd}'].T
            # forearm twist bone: half of the twist between forearm and hand about the forearm axis
            ax = Rfa @ (self.h(f'hand.{Sd}') - self.h(f'forearm.{Sd}')); ax = nrm(ax)
            w_fa = Rfa @ self.seg[f'hand.{Sd}'][:, 1]; w_hd = Rhd @ self.seg[f'hand.{Sd}'][:, 1]
            pa = nrm(w_fa - ax * (w_fa @ ax)); pb = nrm(w_hd - ax * (w_hd @ ax))
            ang = math.atan2(np.cross(pa, pb) @ ax, pa @ pb)
            put(f'forearmTwist.{Sd}', Rax(ax, ang * .5) @ Rfa)
            put(f'hand.{Sd}', Rhd)
            wa = Rhd @ self.seg[f'hand.{Sd}'][:, 1]
            put(f'fingers1.{Sd}', Rax(wa, cu * D2R) @ Rhd)
            put(f'fingers2.{Sd}', Rax(wa, cu * 1.35 * D2R) @ Rhd)
            hd = Rhd @ self.seg[f'hand.{Sd}'][:, 0]
            put(f'thumb1.{Sd}', Rax(hd, -s * cu * .25 * D2R) @ Rhd)
            put(f'thumb2.{Sd}', Rax(wa, cu * .6 * D2R) @ R[i[f'thumb1.{Sd}']])
        for s, Sd in ((-1, 'L'), (1, 'R')):
            f = P['foot'][Sd]; self.leg(P, R, X, put, s, Sd, f)
        return R, X

    def foot_targets(self, f):
        Rf = Ry(f['yaw'] * D2R) @ Rz(-f['pitch'] * D2R)
        G = np.array([f['x'], f['y'], f['z']])
        if f['pitch'] >= 0:
            A = G + Rf @ self.ankle_from_ball
        else:                                   # toes up: roll about the heel
            Ry_ = Ry(f['yaw'] * D2R); Hw = G + Ry_ @ self.heel_from_ball
            A = Hw + Rf @ (self.ankle_from_ball - self.heel_from_ball)
        return Rf, A

    def leg(self, P, R, X, put, s, Sd, f):
        Rf, A = self.foot_targets(f)
        hip = X[self.i['hips']] + R[self.i['hips']] @ (self.h(f'thigh.{Sd}') - self.h('hips'))
        D = A - hip; d = np.linalg.norm(D); dirv = D / d
        L1, L2 = self.L1, self.L2; d = min(max(d, .15), L1 + L2 - 1e-4)
        a1 = math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
        fwd = Ry(f['yaw'] * D2R) @ np.array([1., 0, 0])
        pole = fwd + R[self.i['hips']] @ np.array([0, 0, s * f.get('knee', .12)])
        kf = nrm(pole - dirv * (pole @ dirv))
        K = hip + (dirv * math.cos(a1) + kf * math.sin(a1)) * L1
        u = nrm(K - hip); n = nrm(np.cross(u, -kf))
        put(f'thigh.{Sd}', frame(u, n) @ self.seg[f'thigh.{Sd}'].T)
        sd = nrm(hip + dirv * d - K)
        put(f'shin.{Sd}', frame(sd, n) @ self.seg[f'shin.{Sd}'].T)
        put(f'foot.{Sd}', Rf)
        tp = f.get('toe', None)
        if tp is None: tp = max(0., f['pitch']) if f['y'] < .02 else min(12., max(0, f['pitch']) * .3)
        put(f'toe.{Sd}', Rf @ Rz(tp * D2R))

    def hip_world(self, P, Sd):
        Rp = Ry(P['yaw'] * D2R) @ Rz(-P['lean'] * D2R) @ Rx(P['side'] * D2R)
        return P['pos'] + Rp @ (self.h(f'thigh.{Sd}') - self.h('hips'))

def to_local(rig, R):
    """World rotations -> local rotations (relative to parent, rest = identity)."""
    L = np.zeros_like(R)
    for k, p in enumerate(rig.par): L[k] = R[k] if p < 0 else R[p].T @ R[k]
    return L

def quat(M):
    t = np.trace(M)
    if t > 0:
        S = math.sqrt(t + 1) * 2; w = .25 * S; x = (M[2, 1] - M[1, 2]) / S; y = (M[0, 2] - M[2, 0]) / S; z = (M[1, 0] - M[0, 1]) / S
    elif M[0, 0] > M[1, 1] and M[0, 0] > M[2, 2]:
        S = math.sqrt(1 + M[0, 0] - M[1, 1] - M[2, 2]) * 2; w = (M[2, 1] - M[1, 2]) / S; x = .25 * S; y = (M[0, 1] + M[1, 0]) / S; z = (M[0, 2] + M[2, 0]) / S
    elif M[1, 1] > M[2, 2]:
        S = math.sqrt(1 + M[1, 1] - M[0, 0] - M[2, 2]) * 2; w = (M[0, 2] - M[2, 0]) / S; x = (M[0, 1] + M[1, 0]) / S; y = .25 * S; z = (M[1, 2] + M[2, 1]) / S
    else:
        S = math.sqrt(1 + M[2, 2] - M[0, 0] - M[1, 1]) * 2; w = (M[1, 0] - M[0, 1]) / S; x = (M[0, 2] + M[2, 0]) / S; y = (M[1, 2] + M[2, 1]) / S; z = .25 * S
    q = np.array([w, x, y, z]); return q / np.linalg.norm(q)
