extends Node3D
# Pueblo Alba en Godot, con el mismo arte del juego (exportado desde el juego a godot/arte/).
# Todo se arma por código para poder comparar el resultado con la versión en JavaScript.
# Controles: flechas/WASD, o arrastrar el dedo en la pantalla (palanca virtual).

const BLOCK := "TH~"           # casillas que no se pueden pisar: árboles, casas, agua
const SPEED := 3.6              # casillas por segundo

var rows: Array = []
var W := 0
var H := 0
var player: Sprite3D
var cam: Camera3D
var ppos := Vector2(12.5, 9.6)  # posición en casillas (x, y del mapa = x, z en 3D)
var facing := 0                 # fila del dibujo: 0 abajo, 1 arriba, 2 izquierda, 3 derecha
var walk_t := 0.0
var npcs: Array = []
var touch_id := -1
var touch_origin := Vector2.ZERO
var touch_vec := Vector2.ZERO
var stick: Control
var fps_label: Label
var rng := RandomNumberGenerator.new()
var houses: Array = []          # para volverlas transparentes si el jugador pasa detrás


# ---------- utilidades ----------
func tex(name: String) -> ImageTexture:
	var img := Image.new()
	img.load_png_from_buffer(FileAccess.get_file_as_bytes("res://arte/%s.dat" % name))
	return ImageTexture.create_from_image(img)


func image(name: String) -> Image:
	var img := Image.new()
	img.load_png_from_buffer(FileAccess.get_file_as_bytes("res://arte/%s.dat" % name))
	return img


func mat(t: Texture2D, color := Color.WHITE) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = t
	m.albedo_color = color
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	m.roughness = 1.0
	return m


func tile(x: int, y: int) -> String:
	if y < 0 or y >= H or x < 0 or x >= W:
		return "T"
	return String(rows[y]).substr(x, 1)


func blocked(p: Vector2) -> bool:
	for o in [Vector2(-0.28, -0.1), Vector2(0.28, -0.1), Vector2(-0.28, 0.25), Vector2(0.28, 0.25)]:
		var q: Vector2 = p + o
		if BLOCK.contains(tile(int(floor(q.x)), int(floor(q.y)))):
			return true
	return false


# ---------- escena ----------
func _ready() -> void:
	rng.seed = 7
	var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://arte/map.dat"))
	rows = data["rows"]
	W = int(data["w"])
	H = int(data["h"])
	make_environment()
	make_ground()
	make_water()
	make_trees()
	for b in data["buildings"]:
		make_house(b)
	make_characters()
	make_motes()
	make_camera()
	make_post()
	make_ui()


func make_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color("5a7fd0")
	sm.sky_horizon_color = Color("f4c8a8")
	sm.ground_horizon_color = Color("f4c8a8")
	sm.ground_bottom_color = Color("3a5a30")
	sky.sky_material = sm
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("b0c0f0")
	env.ambient_light_energy = 0.42
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 0.92
	env.glow_enabled = true
	env.glow_intensity = 0.35
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.1
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.15
	env.adjustment_contrast = 1.05
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.light_color = Color("ffe0b0")
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 30.0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.rotation_degrees = Vector3(-48, -32, 0)
	add_child(sun)


func make_ground() -> void:
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(W, H)
	mi.mesh = pm
	mi.material_override = mat(tex("ground"))
	mi.position = Vector3(W / 2.0, 0, H / 2.0)
	add_child(mi)
	# pasto oscuro alrededor, hasta el horizonte
	var far := MeshInstance3D.new()
	var fp := PlaneMesh.new()
	fp.size = Vector2(160, 160)
	far.mesh = fp
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color("2e5a2c")
	fm.roughness = 1.0
	far.material_override = fm
	far.position = Vector3(W / 2.0, -0.02, H / 2.0)
	add_child(far)


func make_water() -> void:
	var x0 := 99
	var x1 := -1
	var y0 := 99
	var y1 := -1
	for y in H:
		for x in W:
			if tile(x, y) == "~":
				x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y)
	if x1 < 0:
		return
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
render_mode unshaded, depth_draw_never, cull_disabled;
void fragment() {
	vec2 p = UV * vec2(12.0, 5.0);
	float w = sin(p.x * 2.7 + TIME * 1.7) * sin(p.y * 3.3 - TIME * 1.2);
	float s = step(0.8, w);
	ALBEDO = mix(vec3(0.28, 0.6, 0.95), vec3(1.0), s * 0.7);
	ALPHA = 0.45 + s * 0.4;
}
"""
	var m := ShaderMaterial.new()
	m.shader = sh
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(x1 - x0 + 1, y1 - y0 + 1)
	mi.mesh = pm
	mi.material_override = m
	mi.position = Vector3((x0 + x1 + 1) / 2.0, 0.03, (y0 + y1 + 1) / 2.0)
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)


func make_trees() -> void:
	var spots: Array = []
	for y in H:
		for x in W:
			if tile(x, y) == "T":
				spots.append(Vector2(x + 0.5 + rng.randf_range(-0.2, 0.2), y + 0.5 + rng.randf_range(-0.2, 0.2)))
	# bosque fuera del mapa, para que no se vea vacío detrás de los árboles del borde
	for y in range(-8, H + 8):
		for x in range(-8, W + 8):
			if (x < 0 or y < 0 or x >= W or y >= H) and rng.randf() < 0.55:
				spots.append(Vector2(x + 0.5 + rng.randf_range(-0.3, 0.3), y + 0.5 + rng.randf_range(-0.3, 0.3)))
	# copas: esferas bajas con textura de hojas pixelada; troncos: cilindros
	var leaves := Image.create(32, 32, false, Image.FORMAT_RGBA8)
	for y in 32:
		for x in 32:
			var v := rng.randf()
			leaves.set_pixel(x, y, Color("3f8a3a") if v < 0.55 else (Color("2f6e32") if v < 0.85 else Color("6ab04a")))
	var lm := mat(ImageTexture.create_from_image(leaves))
	lm.vertex_color_use_as_albedo = true
	var crown := SphereMesh.new()
	crown.radius = 0.75
	crown.height = 1.25
	crown.radial_segments = 9
	crown.rings = 5
	crown.material = lm
	var trunk := CylinderMesh.new()
	trunk.top_radius = 0.1
	trunk.bottom_radius = 0.15
	trunk.height = 0.9
	trunk.radial_segments = 6
	var tm := StandardMaterial3D.new()
	tm.albedo_color = Color("6a4a30")
	trunk.material = tm
	for pair in [[crown, true], [trunk, false]]:
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = pair[1]
		mm.mesh = pair[0]
		mm.instance_count = spots.size()
		rng.seed = 11
		for i in spots.size():
			var s := rng.randf_range(0.85, 1.25)
			var p: Vector2 = spots[i]
			var t := Transform3D(Basis().scaled(Vector3(s, s, s)).rotated(Vector3.UP, rng.randf() * TAU), Vector3(p.x, (1.25 if pair[1] else 0.45) * s, p.y))
			mm.set_instance_transform(i, t)
			if pair[1]:
				mm.set_instance_color(i, Color(1, 1, 1).lerp(Color("c8e890"), rng.randf() * 0.5))
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		add_child(mmi)


func make_house(b: Dictionary) -> void:
	var bx := float(b["x"])
	var by := float(b["y"])
	var bw := float(b["w"])
	var bh := float(b["h"])
	var facade_name := "facade_" + String(b["style"])
	var img := image(facade_name)
	# dónde empieza la pared en la fachada 2D: primera fila (de arriba hacia abajo) con color de pared
	var roof_c := Color(String(b["roof"]))
	var wall_c := Color(String(b["wall"]))
	var cut := img.get_height() / 2
	for y in img.get_height():
		var c := img.get_pixel(img.get_width() - 6, y)
		if absf(c.r - wall_c.r) + absf(c.g - wall_c.g) + absf(c.b - wall_c.b) < 0.12:
			cut = max(0, y - 1)
			break
	cut = max(cut, img.get_height() - 30)  # paredes de 1,9 casillas como mucho (más altas tapan al jugador)
	var wall_h := float(img.get_height() - cut) / 16.0
	var front := mat(tex(facade_name))
	front.uv1_scale = Vector3(1, float(img.get_height() - cut) / img.get_height(), 1)
	front.uv1_offset = Vector3(0, float(cut) / img.get_height(), 0)
	var depth := bh - 0.6
	var z_front := by + bh
	var root := Node3D.new()
	add_child(root)
	# frente con la fachada del juego
	var q := MeshInstance3D.new()
	var qm := QuadMesh.new()
	qm.size = Vector2(bw, wall_h)
	q.mesh = qm
	q.material_override = front
	q.position = Vector3(bx + bw / 2.0, wall_h / 2.0, z_front)
	root.add_child(q)
	# cuerpo de la casa (lados y fondo)
	var body := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(bw - 0.02, wall_h, depth)
	body.mesh = bm
	var wm := StandardMaterial3D.new()
	wm.albedo_color = Color(String(b["wall"])).darkened(0.05)
	body.material_override = wm
	body.position = Vector3(bx + bw / 2.0, wall_h / 2.0, z_front - depth / 2.0 - 0.01)
	root.add_child(body)
	# techo a dos aguas con tejas
	var sh := Shader.new()
	sh.code = """
shader_type spatial;
render_mode depth_prepass_alpha;
uniform vec4 roof : source_color;
uniform float alpha = 1.0;
void fragment() {
	ALPHA = alpha;
	vec2 p = UV * vec2(14.0, 9.0);
	float row = floor(p.y);
	float x = fract(p.x + row * 0.5);
	float y = fract(p.y);
	float edge = clamp(step(0.82, y) + step(0.93, x), 0.0, 1.0);
	ALBEDO = roof.rgb * (1.0 - 0.28 * edge) * (0.88 + 0.12 * y);
	ROUGHNESS = 0.85;
}
"""
	var rm := ShaderMaterial.new()
	rm.shader = sh
	rm.set_shader_parameter("roof", roof_c)
	var roof := MeshInstance3D.new()
	var pr := PrismMesh.new()
	pr.size = Vector3(depth + 0.7, 1.3, bw + 0.5)
	roof.mesh = pr
	roof.material_override = rm
	roof.rotation_degrees = Vector3(0, 90, 0)
	roof.position = Vector3(bx + bw / 2.0, wall_h + 0.65, z_front - depth / 2.0)
	root.add_child(roof)
	for m in [front, wm]:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_DEPTH_PRE_PASS
	houses.append({"x0": bx - 0.6, "x1": bx + bw + 0.6, "y0": by - 2.5, "y1": z_front - 0.3, "mats": [front, wm], "roof": rm, "a": 1.0})


func make_sprite(sheet: String, pos: Vector2) -> Sprite3D:
	var s := Sprite3D.new()
	s.texture = tex(sheet)
	s.hframes = 3
	s.vframes = 4
	s.pixel_size = 1.0 / 32.0
	s.offset = Vector2(0, 22)
	s.billboard = BaseMaterial3D.BILLBOARD_FIXED_Y
	s.alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD
	s.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	s.shaded = true
	s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	s.position = Vector3(pos.x, 0, pos.y)
	add_child(s)
	return s


func make_characters() -> void:
	player = make_sprite("player", ppos)
	var g := make_sprite("girl", Vector2(8.5, 12.6))
	npcs.append({"s": g, "p": Vector2(8.5, 12.6), "home": Vector2(8.5, 12.6), "goal": Vector2(8.5, 12.6), "wait": 1.0, "t": 0.0})
	var o := make_sprite("oldman", Vector2(14.5, 17.6))
	o.frame = 3 * 2
	npcs.append({"s": o, "p": Vector2(14.5, 17.6), "home": Vector2(14.5, 17.6), "goal": Vector2(14.5, 17.6), "wait": 999.0, "t": 0.0})


func make_motes() -> void:
	var p := CPUParticles3D.new()
	p.amount = 90
	p.lifetime = 7.0
	p.preprocess = 7.0
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(W / 2.0, 1.2, H / 2.0)
	p.position = Vector3(W / 2.0, 1.4, H / 2.0)
	p.direction = Vector3(0.2, 1, 0)
	p.spread = 40.0
	p.gravity = Vector3(0, 0.03, 0)
	p.initial_velocity_min = 0.05
	p.initial_velocity_max = 0.2
	var q := QuadMesh.new()
	q.size = Vector2(0.06, 0.06)
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.albedo_color = Color(1.0, 0.95, 0.7, 0.8)
	q.material = m
	p.mesh = q
	add_child(p)


func make_camera() -> void:
	cam = Camera3D.new()
	cam.fov = 30.0
	cam.near = 0.5
	cam.far = 120.0
	add_child(cam)
	place_camera(1.0)


func place_camera(k: float) -> void:
	var target := Vector3(ppos.x, 0.6, ppos.y)
	var want := target + Vector3(0, 9.5, 12.5)
	cam.position = cam.position.lerp(want, k)
	cam.look_at(cam.position + (target - want), Vector3.UP)


# desenfoque arriba y abajo (estilo «HD-2D») y viñeta, sobre la imagen final
func make_post() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 0
	add_child(layer)
	var r := ColorRect.new()
	r.set_anchors_preset(Control.PRESET_FULL_RECT)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh := Shader.new()
	sh.code = """
shader_type canvas_item;
uniform sampler2D screen_tex : hint_screen_texture, filter_linear;
void fragment() {
	vec2 uv = SCREEN_UV;
	float d = uv.y - 0.56;
	float b = smoothstep(0.14, 0.5, abs(d)) * (d < 0.0 ? 4.0 : 2.5);
	vec3 c = texture(screen_tex, uv).rgb;
	if (b > 0.05) {
		vec3 acc = c;
		for (int i = 1; i < 14; i++) {
			float a = float(i) * 2.39996;
			float r = sqrt(float(i)) * 0.6;
			acc += texture(screen_tex, uv + vec2(cos(a), sin(a)) * r * b * SCREEN_PIXEL_SIZE).rgb;
		}
		c = mix(c, acc / 14.0, smoothstep(0.05, 0.6, b));
	}
	vec2 q = uv - 0.5;
	c *= 1.0 - dot(q, q) * 0.6;
	COLOR = vec4(c, 1.0);
}
"""
	var m := ShaderMaterial.new()
	m.shader = sh
	r.material = m
	layer.add_child(r)


# palanca virtual (dedo) y contador de cuadros por segundo
class Stick extends Control:
	var center := Vector2.ZERO
	var knob := Vector2.ZERO
	var on := false
	func _draw() -> void:
		if on:
			draw_circle(center, 46.0, Color(1, 1, 1, 0.18))
			draw_arc(center, 46.0, 0, TAU, 32, Color(1, 1, 1, 0.5), 2.0)
			draw_circle(center + knob * 40.0, 20.0, Color(1, 1, 1, 0.55))


func make_ui() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 1
	add_child(layer)
	stick = Stick.new()
	stick.set_anchors_preset(Control.PRESET_FULL_RECT)
	stick.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(stick)
	fps_label = Label.new()
	fps_label.position = Vector2(10, 448)
	fps_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.85))
	fps_label.add_theme_color_override("font_outline_color", Color(0, 0, 0))
	fps_label.add_theme_constant_override("outline_size", 4)
	fps_label.add_theme_font_size_override("font_size", 14)
	layer.add_child(fps_label)


func _input(e: InputEvent) -> void:
	if e is InputEventScreenTouch:
		if e.pressed and touch_id == -1:
			touch_id = e.index
			touch_origin = e.position
			touch_vec = Vector2.ZERO
		elif not e.pressed and e.index == touch_id:
			touch_id = -1
			touch_vec = Vector2.ZERO
	elif e is InputEventScreenDrag and e.index == touch_id:
		touch_vec = ((e.position - touch_origin) / 40.0).limit_length(1.0)
	var st := stick as Stick
	st.on = touch_id != -1
	st.center = touch_origin
	st.knob = touch_vec
	st.queue_redraw()


func _process(dt: float) -> void:
	# entrada
	var v := touch_vec
	if Input.is_key_pressed(KEY_LEFT) or Input.is_key_pressed(KEY_A): v.x -= 1
	if Input.is_key_pressed(KEY_RIGHT) or Input.is_key_pressed(KEY_D): v.x += 1
	if Input.is_key_pressed(KEY_UP) or Input.is_key_pressed(KEY_W): v.y -= 1
	if Input.is_key_pressed(KEY_DOWN) or Input.is_key_pressed(KEY_S): v.y += 1
	v = v.limit_length(1.0)
	var moving := v.length() > 0.15
	if moving:
		var step := v * SPEED * dt
		var nx := ppos + Vector2(step.x, 0)
		if not blocked(nx): ppos = nx
		var ny := ppos + Vector2(0, step.y)
		if not blocked(ny): ppos = ny
		facing = (3 if v.x > 0 else 2) if absf(v.x) > absf(v.y) else (0 if v.y > 0 else 1)
		walk_t += dt * 7.0 * v.length()
	else:
		walk_t = 0.0
	var seq := [0, 1, 0, 2]
	player.frame = facing * 3 + (seq[int(walk_t) % 4] if moving else 0)
	player.position = Vector3(ppos.x, 0, ppos.y)
	# la niña pasea cerca de su lugar
	for n in npcs:
		var s: Sprite3D = n["s"]
		n["wait"] -= dt
		if n["wait"] <= 0.0 and n["wait"] > -50.0:
			n["goal"] = n["home"] + Vector2(rng.randf_range(-1.5, 1.5), rng.randf_range(-1.0, 1.0))
			n["wait"] = rng.randf_range(2.5, 4.5)
		var d: Vector2 = n["goal"] - n["p"]
		if d.length() > 0.05 and n["wait"] < 900.0:
			var stp: Vector2 = d.normalized() * min(d.length(), 1.6 * dt)
			if not blocked(n["p"] + stp): n["p"] += stp
			n["t"] += dt * 6.0
			var f := (3 if d.x > 0 else 2) if absf(d.x) > absf(d.y) else (0 if d.y > 0 else 1)
			s.frame = f * 3 + [0, 1, 0, 2][int(n["t"]) % 4]
		elif n["wait"] < 900.0:
			s.frame = (s.frame / 3) * 3
		s.position = Vector3(n["p"].x, 0, n["p"].y)
	for h in houses:
		var behind: bool = ppos.x > h["x0"] and ppos.x < h["x1"] and ppos.y > h["y0"] and ppos.y < h["y1"]
		h["a"] = move_toward(h["a"], 0.35 if behind else 1.0, dt * 3.0)
		for m in h["mats"]:
			m.albedo_color.a = h["a"]
		h["roof"].set_shader_parameter("alpha", h["a"])
	place_camera(min(1.0, dt * 6.0))
	fps_label.text = "Godot 4.3 · web · %d cuadros/s" % Engine.get_frames_per_second()
