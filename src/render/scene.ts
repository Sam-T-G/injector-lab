import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { animate, frame } from 'motion'
import { spraySigma, type PointResult, type Scenario } from '../physics'

export type ViewPreset = 'three-quarter' | 'side' | 'nozzle'

const AXIAL = 64 // samples along each spray
const SEG = 28 // segments around each spray

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** A tube of radius r(y) whose radii can be changed in place, for tweening between cases. */
class SprayTube {
  readonly geometry = new THREE.BufferGeometry()
  private pos: Float32Array
  private ys: Float32Array
  private sin = new Float32Array(SEG + 1)
  private cos = new Float32Array(SEG + 1)

  constructor(length: number) {
    this.ys = Float32Array.from({ length: AXIAL }, (_, i) => (i / (AXIAL - 1)) * length)
    for (let j = 0; j <= SEG; j++) {
      this.sin[j] = Math.sin((2 * Math.PI * j) / SEG)
      this.cos[j] = Math.cos((2 * Math.PI * j) / SEG)
    }
    this.pos = new Float32Array(AXIAL * (SEG + 1) * 3)
    const index: number[] = []
    for (let i = 0; i < AXIAL - 1; i++) {
      for (let j = 0; j < SEG; j++) {
        const a = i * (SEG + 1) + j
        const b = a + SEG + 1
        index.push(a, b, a + 1, b, b + 1, a + 1)
      }
    }
    this.geometry.setIndex(index)
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
  }

  get axial(): Float32Array {
    return this.ys
  }

  setRadii(r: ArrayLike<number>): void {
    let k = 0
    for (let i = 0; i < AXIAL; i++) {
      for (let j = 0; j <= SEG; j++) {
        this.pos[k++] = r[i]! * this.sin[j]!
        this.pos[k++] = this.ys[i]!
        this.pos[k++] = r[i]! * this.cos[j]!
      }
    }
    this.geometry.attributes.position!.needsUpdate = true
    this.geometry.computeBoundingSphere()
  }
}

function label(text: string, cls = 'dim'): CSS2DObject {
  const el = document.createElement('div')
  el.className = cls
  el.textContent = text
  return new CSS2DObject(el)
}

function line(points: THREE.Vector3[], color: string): THREE.Line {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color }))
}

/** Engine drawing: injector body, half-section chamber and nozzle, 2-sigma spray envelopes, and one section plane. */
export class InjectorView {
  private renderer: THREE.WebGLRenderer
  private labels = new CSS2DRenderer()
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 1, 1, 10000)
  private controls: OrbitControls
  private engine = new THREE.Group()
  private dynamic = new THREE.Group()
  private dims = new THREE.Group()
  private sprays: { ox: SprayTube; fuel: SprayTube } | null = null
  private sprayR: { ox: Float32Array; fuel: Float32Array } | null = null
  private section: THREE.Mesh | null = null
  private sectionTex: THREE.DataTexture | null = null
  private result: PointResult | null = null
  private size = { len: 300, rBody: 40, xMid: 150 }
  private pending = false
  private reduce = matchMedia('(prefers-reduced-motion: reduce)')
  readonly ok: boolean

  constructor(private mount: HTMLElement) {
    let renderer: THREE.WebGLRenderer | null = null
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      renderer = null
    }
    this.ok = renderer !== null
    this.renderer = renderer ?? (null as unknown as THREE.WebGLRenderer)
    if (!renderer) {
      mount.innerHTML = '<p class="note">This browser could not start WebGL, so the 3D drawing is off. Every number below still works.</p>'
      this.controls = null as unknown as OrbitControls
      return
    }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1))
    mount.append(renderer.domElement)
    this.labels.domElement.className = 'labels'
    mount.append(this.labels.domElement)
    // Engine axis along world +X; chamber cross-section x maps to -Z and y to +Y, so the
    // view from the nozzle end matches the 2D section map.
    this.engine.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0)),
    )
    this.scene.add(this.engine)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xc9d0cc, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(-200, 500, 400)
    this.scene.add(sun)
    this.controls = new OrbitControls(this.camera, renderer.domElement)
    this.controls.enableDamping = false
    this.controls.addEventListener('change', () => this.requestRender())
    new ResizeObserver(() => this.resize()).observe(mount)
    this.resize()
  }

  private resize(): void {
    if (!this.ok) return
    const w = this.mount.clientWidth
    const h = this.mount.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.renderer.domElement.style.width = `${w}px`
    this.renderer.domElement.style.height = `${h}px`
    this.labels.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }

  requestRender(): void {
    if (this.pending || !this.ok) return
    this.pending = true
    frame.render(() => {
      this.pending = false
      this.renderer.render(this.scene, this.camera)
      this.labels.render(this.scene, this.camera)
    })
  }

  private clear(): void {
    for (const g of [this.engine, this.dynamic, this.dims]) {
      g.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else mat?.dispose()
        if (o instanceof CSS2DObject) o.element.remove()
      })
    }
    this.engine.clear()
    this.dynamic.clear()
    this.dims.clear()
    this.sectionTex?.dispose()
    this.sectionTex = null
  }

  /** Rebuild the drawing for a new result; the sprays show the given case. */
  setResult(r: PointResult, s: Scenario, geom: { thicknessMm: number; bodyMarginMm: number }): void {
    if (!this.ok) return
    const first = this.result === null
    this.clear()
    this.result = r
    const mm = 1000
    const e = r.engine
    const Rc = (e.Dc / 2) * mm
    const Rt = (e.Dt / 2) * mm
    const Re = Rt * Math.sqrt(Math.max(1, e.comb.eps))
    const Lc = e.Lc * mm
    const body = Rc + geom.bodyMarginMm
    const bodyT = geom.thicknessMm
    const conv = (Rc - Rt) / Math.tan((30 * Math.PI) / 180)
    const div = (Re - Rt) / Math.tan((15 * Math.PI) / 180)
    const len = Lc + conv + div
    this.size = { len, rBody: body, xMid: (len - bodyT) / 2 }

    const ink = css('--ink')
    // Injector body (upstream of the face at y = 0).
    const bodyGeo = new THREE.CylinderGeometry(body, body, bodyT, 96)
    const bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: css('--metal'), roughness: 0.7, metalness: 0.1 }))
    bodyMesh.position.y = -bodyT / 2
    this.engine.add(bodyMesh)
    const bodyEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo, 40), new THREE.LineBasicMaterial({ color: ink }))
    bodyEdges.position.y = -bodyT / 2
    this.engine.add(bodyEdges)

    // Holes, true size, with a colored ring so the two propellants read apart.
    for (const side of [r.ox, r.fuel]) {
      const d = side.hole.d * mm
      const color = css(side.prop === 'ox' ? '--lox' : '--fuel')
      const holeMat = new THREE.MeshBasicMaterial({ color: ink })
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      for (let k = 0; k < side.holes; k++) {
        const a = ((side.clockDeg + (360 * k) / side.holes) * Math.PI) / 180
        const x = side.ringRadius * mm * Math.cos(a)
        const z = -side.ringRadius * mm * Math.sin(a)
        const hole = new THREE.Mesh(new THREE.CircleGeometry(d / 2, 20), holeMat)
        const ring = new THREE.Mesh(new THREE.RingGeometry(d / 2, d / 2 + 0.9, 24), ringMat)
        for (const m of [hole, ring]) {
          m.rotation.x = -Math.PI / 2
          m.position.set(x, 0.05, z)
          this.engine.add(m)
        }
      }
    }

    // Chamber and conical nozzle sketch, far half only, with the section outline.
    const prof = [
      new THREE.Vector2(Rc, 0),
      new THREE.Vector2(Rc, Lc),
      new THREE.Vector2(Rt, Lc + conv),
      new THREE.Vector2(Re, Lc + conv + div),
    ]
    const shell = new THREE.Mesh(
      new THREE.LatheGeometry(prof, 96, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: css('--metal'), roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.55, depthWrite: false }),
    )
    shell.renderOrder = 1
    this.engine.add(shell)
    for (const sign of [1, -1]) {
      this.engine.add(line(prof.map((p) => new THREE.Vector3(0, p.y, sign * p.x)), ink))
    }
    for (const y of [0, Lc]) {
      const ring = new THREE.EllipseCurve(0, 0, Rc, Rc, 0, Math.PI, false)
      this.engine.add(line(ring.getPoints(64).map((p) => new THREE.Vector3(p.y, y, p.x)), ink))
    }

    // Dimensions: chamber length below the engine, diameters as leaders.
    const zDim = body + 14
    this.dims.add(line([new THREE.Vector3(0, 0, Rc), new THREE.Vector3(0, 0, zDim + 4)], ink))
    this.dims.add(line([new THREE.Vector3(0, Lc, Rc), new THREE.Vector3(0, Lc, zDim + 4)], ink))
    this.dims.add(line([new THREE.Vector3(0, 0, zDim), new THREE.Vector3(0, Lc, zDim)], ink))
    for (const y of [0, Lc]) {
      const dir = y === 0 ? 1 : -1
      this.dims.add(line([new THREE.Vector3(0, y, zDim), new THREE.Vector3(0, y + dir * 5, zDim - 2), new THREE.Vector3(0, y + dir * 5, zDim + 2), new THREE.Vector3(0, y, zDim)], ink))
    }
    const lcLabel = label(`${Lc.toFixed(1)} chamber`)
    lcLabel.position.set(0, Lc / 2, zDim + 10)
    this.dims.add(lcLabel)
    const leader = (y: number, r: number, text: string) => {
      const tip = new THREE.Vector3(0, y, -r)
      const elbow = new THREE.Vector3(0, y + 10, -r - 22)
      this.dims.add(line([tip, elbow], ink))
      const l = label(text)
      l.position.copy(elbow).add(new THREE.Vector3(0, 0, -8))
      this.dims.add(l)
    }
    leader(Lc * 0.55, Rc, `⌀${(2 * Rc).toFixed(1)} chamber`)
    leader(Lc + conv, Rt, `⌀${(2 * Rt).toFixed(1)} throat`)

    this.engine.add(this.dims)

    // Sprays and section plane.
    this.sprays = { ox: new SprayTube(Lc), fuel: new SprayTube(Lc) }
    for (const side of [r.ox, r.fuel]) {
      const tube = this.sprays[side.prop]
      const mat = new THREE.MeshBasicMaterial({
        color: css(side.prop === 'ox' ? '--lox' : '--fuel'),
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      for (let k = 0; k < side.holes; k++) {
        const a = ((side.clockDeg + (360 * k) / side.holes) * Math.PI) / 180
        const m = new THREE.Mesh(tube.geometry, mat)
        m.position.set(side.ringRadius * mm * Math.cos(a), 0, -side.ringRadius * mm * Math.sin(a))
        m.renderOrder = 2
        this.dynamic.add(m)
      }
    }
    this.sprayR = null
    this.setScenario(s, false)
    this.engine.add(this.dynamic)
    if (first) this.view('three-quarter', false)
    this.requestRender()
  }

  private radii(s: Scenario): { ox: Float32Array; fuel: Float32Array } {
    const r = this.result!
    const sc = r.scenarios[s]!
    const out = { ox: new Float32Array(AXIAL), fuel: new Float32Array(AXIAL) }
    for (const side of [r.ox, r.fuel]) {
      const p = sc[side.prop]
      const ys = this.sprays![side.prop].axial
      for (let i = 0; i < AXIAL; i++) out[side.prop][i] = 2 * spraySigma(ys[i]! / 1000, side.hole.d, p.drop.tanHalfAngle, p.xv) * 1000
    }
    return out
  }

  /** Change which case the spray envelopes show; tweens the radii. */
  setScenario(s: Scenario, tween = true): void {
    if (!this.ok || !this.result || !this.sprays) return
    const to = this.radii(s)
    const from = this.sprayR
    const apply = (u: number) => {
      for (const k of ['ox', 'fuel'] as const) {
        const cur = new Float32Array(AXIAL)
        for (let i = 0; i < AXIAL; i++) cur[i] = from ? from[k][i]! + u * (to[k][i]! - from[k][i]!) : to[k][i]!
        this.sprays![k].setRadii(cur)
      }
      this.requestRender()
    }
    this.sprayR = to
    if (!tween || !from || this.reduce.matches) return apply(1)
    animate(0, 1, { duration: 0.6, ease: [0.3, 0.6, 0.2, 1], onUpdate: apply })
  }

  /** Place the section plane at x mm from the face, colored by the given RGBA field (n x n). */
  setSection(xMm: number, px: Uint8ClampedArray, n: number): void {
    if (!this.ok || !this.result) return
    const Rc = (this.result.engine.Dc / 2) * 1000
    if (!this.section) {
      this.section = new THREE.Mesh(
        new THREE.CircleGeometry(Rc, 96),
        new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false }),
      )
      this.section.rotation.x = -Math.PI / 2
      this.section.renderOrder = 3
      const rim = line(new THREE.EllipseCurve(0, 0, Rc, Rc, 0, 2 * Math.PI, false).getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0.01)), css('--ink'))
      this.section.add(rim)
      this.dynamic.add(this.section)
    }
    if (!this.sectionTex || this.sectionTex.image.width !== n) {
      this.sectionTex?.dispose()
      this.sectionTex = new THREE.DataTexture(new Uint8Array(n * n * 4), n, n, THREE.RGBAFormat)
      this.sectionTex.colorSpace = THREE.SRGBColorSpace
      this.sectionTex.magFilter = THREE.LinearFilter
      this.sectionTex.minFilter = THREE.LinearFilter
      ;(this.section.material as THREE.MeshBasicMaterial).map = this.sectionTex
      ;(this.section.material as THREE.MeshBasicMaterial).needsUpdate = true
    }
    ;(this.sectionTex.image.data as Uint8Array).set(px)
    this.sectionTex.needsUpdate = true
    this.section.position.y = xMm
    this.requestRender()
  }

  view(preset: ViewPreset, tween = true): void {
    if (!this.ok) return
    const { len, rBody, xMid } = this.size
    const D = Math.max(len, 3 * rBody)
    const targets: Record<ViewPreset, [THREE.Vector3, THREE.Vector3]> = {
      'three-quarter': [new THREE.Vector3(xMid + 0.75 * D, 0.62 * D, 1.55 * D), new THREE.Vector3(xMid, 0, 0)],
      side: [new THREE.Vector3(xMid, 0, 2.1 * D), new THREE.Vector3(xMid, 0, 0)],
      nozzle: [new THREE.Vector3(len + 5.5 * rBody, 0.0001, 0.0001), new THREE.Vector3(0, 0, 0)],
    }
    const [pos, tgt] = targets[preset]
    // Leaders and dimension lines stack on top of each other when seen end-on.
    this.dims.visible = preset !== 'nozzle'
    this.dims.traverse((o) => {
      if (o instanceof CSS2DObject) o.element.style.display = preset === 'nozzle' ? 'none' : ''
    })
    const p0 = this.camera.position.clone()
    const t0 = this.controls.target.clone()
    const apply = (u: number) => {
      this.camera.position.lerpVectors(p0, pos, u)
      this.controls.target.lerpVectors(t0, tgt, u)
      this.controls.update()
      this.requestRender()
    }
    if (!tween || this.reduce.matches) return apply(1)
    animate(0, 1, { duration: 0.9, ease: [0.4, 0, 0.2, 1], onUpdate: apply })
  }
}
