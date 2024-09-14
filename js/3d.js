// 3d.js
// @author octopoulo <polluxyz@gmail.com>
// @version 2021-02-19
//
// general 3d rendering code
//
// included after: common, engine, global
// jshint -W069
/*
globals
_, Abs, add_timeout, AnimationFrame, Assign, Attrs, Audio, C, CacheId, CameraControls, clear_timeout,
DefaultInt, DEV, document, Events, Exp, exports, Format, global, HTML, IsString, KEY_TIMES, Keys, KEYS,
LoadLibrary, LS, navigator, Now, require,
S, save_option, set_modal_events, Show, Stats, Style, T:true, THREE, translate_nodes,
Vector2:true, Visible, window, Y, y_x
*/
'use strict';

// <<
if (typeof global != 'undefined' && typeof require != 'undefined') {
    ['common'].forEach(key => {
        Object.assign(global, require(`./${key}.js`));
    });
}
// >>

let audiobox = {
        sounds: {},
    },
    axes = [0, 0, 0, 0],
    AXIS_DEAD_ZONE = 0.2,
    AXIS_MAPPING = [
        [37, 39],
        [38, 40],
        [37, 39],
        [38, 40],
    ],
    bodies = [],
    BUTTON_MAPPING = {
        0: 83,          // X
        1: 69,          // O
        2: 32,          // square
        3: 67,          // triangle
        4: 65,          // L1
        5: 68,          // R1
        6: 192,         // L2
        7: 82,          // R2
        8: 27,          // share
        9: 27,          // options
        // 10,          // L3
        // 11,          // R3
        12: 38,         // up
        13: 40,         // down
        14: 37,         // left
        15: 39,         // right
        16: 27,         // home
        17: 27,         // touch bar
    },
    button_repeat,
    button_repeat_time,
    buttons = {},
    camera,
    camera_auto,
    camera_control,
    camera_id,
    camera_id2,
    camera_look,
    camera_pos,
    camera_reverse,
    camera_target,
    CAMERAS = {
        'static': {
            dir: [0, 0, 0],
            lerp: [-1, -1, 0],
            pos: [0, 0, 0],
        },
    },
    clock,
    clock2,
    controls,
    cube,
    cubes = [],
    debugs = {},
    deltas = [0, 0, 0],
    dirty = 0,
    draco_loader,
    frame = 0,
    gamepad_id,
    gamepads = {},
    gltf_loader,
    is_octo,
    is_paused,
    light_ambient,
    light_main,
    light_target,
    light_under,
    modal_name,
    models = {},
    next_paused,
    now,
    now2,
    old_pos,
    old_rot,
    PARENT_3D = 'body',
    PARTS = [],
    raycaster,
    rendered = 0,
    renderer,
    scene,
    SHADOW_QUALITIES = {
        off: [0, 0, 0],
        'very low': [1, 33, 512],       // 15.52
        low: [1, 53, 1024],             // 19.32
        medium: [2, 80, 2048],          // 25.6
        high: [2, 106, 4096],           // 38.64
        'very high': [2, 166, 8192],    // 49.35
    },
    sim_times = [],
    SIMULATION_HZ = 60,
    stats,
    STEPS = {},
    T,
    t_quat,
    t_rot,
    t_sphere,
	t_vector,
    t_vector2,
    t_vector3,
    t_vector4,
    t_vector5,
    three_loaded,
    u_vector,
    use_controls = true,
    VECTOR_0,
    VECTOR_X,
    VECTOR_Y,
    VECTOR_Z,
    VECTORS,
    vibration,
    virtual_animate_scenery,
    virtual_can_render_simulate,
    virtual_game_action_key,
    virtual_game_action_keyup,
    virtual_game_actions,
    virtual_init_3d_special,
    virtual_init_lights_special,
    virtual_post_render,
    virtual_post_simulation,
    virtual_pre_render,
    virtual_pre_simulation,
    virtual_random_position,
    virtual_resize_3d_special,
    virtual_show_modal_special,
    virtual_simulate_object,
    virtual_update_camera,
    virtual_update_debug_special,
    virtual_update_light_settings_special,
    virtual_update_renderer_special,
    world,
    world_transform;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** @typedef {{x:number, y:number, z:number, w:number}} */
let Quaternion;
/** @typedef {{x:number, y:number, z:number}} */
let Vector3;

/**
 * @typedef {{
 * position: Vector3,
 * quaternion: Quaternion,
 * rotation: *,
 * }} */
let Object3D;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 3D
/////

/**
 * Create a directional light
 * @param {string} name
 * @returns {Object3D}
 */
function create_light(name) {
    let light = new T.DirectionalLight(0xfff0f0, 4);
    light.name = name;
    light.ui = true;
    light.position.set(0, 0, 1666);
    return light;
}

/**
 * Initialise the 3D engine:
 * + create the scene
 * + load the ship model
 * + create the renderer
 * @param {boolean=} force true if the 3d library has been loaded + request a render
 */
function init_3d(force) {
    if (Vector3)
        return;
    if (force)
        three_loaded = true;
    if (!three_loaded)
        return;

    // vars
    if (!T)
        T = window.T = window.THREE;

    Object3D = T.Object3D;
    Quaternion = T.Quaternion;
    Vector2 = T.Vector2;
    Vector3 = T.Vector3;

    camera_look = new_vector3();
    camera_pos = new_vector3();
    clock = new T.Clock();
    clock2 = new T.Clock();
    raycaster = new T.Raycaster();
    VECTOR_0 = new_vector3(0, 0, 0);
    VECTOR_X = new_vector3(1, 0, 0);
    VECTOR_Y = new_vector3(0, 1, 0);
    VECTOR_Z = new_vector3(0, 0, 1);
    VECTORS = {
        0: VECTOR_0,
        x: VECTOR_X,
        y: VECTOR_Y,
        z: VECTOR_Z,
    };
    Object3D.DefaultUp.copy(VECTOR_Z);

    // memory objects
    old_pos = new_vector3();
    old_rot = new_vector3();
    t_quat = new_quaternion();
    t_rot = new T.Euler();
    t_sphere = new T.Sphere();
    t_vector = new_vector3();
    t_vector2 = new_vector3();
    t_vector3 = new_vector3();
    t_vector4 = new_vector3();
    t_vector5 = new_vector3();
    u_vector = new_vector2();

    // scene
    scene = new T.Scene();
    if (virtual_init_3d_special)
        virtual_init_3d_special();
    init_lights();

    // renderer
    let canvas = CacheId('canvas'),
    context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    renderer = new T.WebGLRenderer({
        antialias: false,
        canvas: canvas,
        context: context,
    });
    Assign(renderer, {
        gammaFactor: 1.5,
        outputEncoding: T.GammaEncoding,
        physicallyCorrectLights: true,
        shadowMapSoft: true,
        toneMappingExposure: 3.2,
    });
    renderer.shadowMap.enabled = !!Y['shadow'];
    // renderer.shadowMap.type = T.PCFSoftShadowMap;

    // more
    if (DEV['frame']) {
        stats = new window.Stats();
        stats.showPanel(0);     // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild(stats.dom);
    }
    resize_3d();

    if (force)
        AnimationFrame(render);
}

/**
 * Initialise the lights
 */
function init_lights() {
    //
    light_ambient = new T.AmbientLight(0xffffff);
    light_ambient.name = 'ambient';
    light_ambient.ui = true;
    scene.add(light_ambient);

    // target
    light_target = new Object3D();
    light_target.name = 'light_target';
    scene.add(light_target);

    // follows the target in front of the ship
    light_main = create_light('direction');
    scene.add(light_main);
    update_light_settings();

    if (virtual_init_lights_special)
        virtual_init_lights_special();
}

/**
 * Interpolate
 * @param {Object3D} part
 * @param {number} epsilon
 */
function interpolate(part, epsilon) {
    if (!part)
        return;

    // 1) backup
    if (part.pos3)
        part.pos3.copy(part.position);
    if (part.quat3)
        part.quat3.copy(part.quaternion);

    // (s)lerp
    if (part.pos2)
        part.position.lerp(part.pos2, epsilon);
    if (part.quat2)
        part.quaternion.slerp(part.quat2, epsilon);
}

/**
 * Restore the latest position/quaternion
 * @param {Object3D} part
 */
function interpolate_restore(part) {
    if (!part)
        return;
    if (part.pos3)
        part.position.copy(part.pos3);
    if (part.quat3)
        part.quaternion.copy(part.quat3);
}

/**
 * Store previous position/quaternion
 * @param {Object3D} part
 */
function interpolate_store(part) {
    if (!part)
        return;
    if (part.pos2)
        part.pos2.copy(part.position);
    if (part.quat2)
        part.quat2.copy(part.quaternion);
}

/**
 * Load a model
 * @param {string} name key for model storage
 * @param {string} filename
 * @param {Function} callback
 */
function load_model(name, filename, callback) {
    // 0) need T
    if (!T) {
        if (callback)
            callback(null);
        return;
    }

    // 1) check memory
    let model = models[name];
    if (model) {
        if (callback)
            callback(model, false);
        return;
    }

    // 2) load libraries
    if (!gltf_loader)
        gltf_loader = new T.GLTFLoader();

    if (!draco_loader && filename.includes('-draco')) {
        draco_loader = new T.DRACOLoader();
        draco_loader.setDecoderPath('js/libs/draco/');
        gltf_loader.setDRACOLoader(draco_loader);
    }

    // 3) load the model
    gltf_loader.load(filename,
        object => {
            if (object.scene)
                object = object.scene;
            models[name] = object;
            if (callback)
                callback(object, true);
        },
        xhr => {
            // LS(`${name} : ${Format(xhr.loaded / xhr.total * 100)}% loaded`);
        },
        err => {
            LS(err);
            if (callback)
                callback(null);
        }
    );
}

/**
 * Load multiple models
 * @param {!Object} filenames
 * @param {Function} callback
 */
function load_models(filenames, callback) {
    let keys = Keys(filenames),
        loads = new Set(),
        remains = new Set(keys);

    keys.forEach(key => {
        let filename = filenames[key];
        load_model(key, filename, (_model, is_new) => {
            remains.delete(key);
            if (is_new)
                loads.add(key);
            if (!remains.size)
                callback(loads);
        });
    });
}

/**
 * Create a new Quaternion
 * @param {number=} x
 * @param {number=} y
 * @param {number=} z
 * @param {number=} w
 * @returns {Quaternion}
 */
function new_quaternion(x, y, z, w) {
    return new Quaternion(x, y, z, w);
}

/**
 * Create a new Vector2
 * @param {number=} x
 * @param {number=} y
 * @returns {Vector2}
 */
function new_vector2(x, y) {
    return new Vector2(x, y);
}

/**
 * Create a new Vector3
 * @param {number=} x
 * @param {number=} y
 * @param {number=} z
 * @returns {Vector3}
 */
function new_vector3(x, y, z) {
    return new Vector3(x, y, z);
}

/**
 * Render the 3D scene
 */
function render() {
    if (!cube || !clock || !T || !Y.three)
        return;

    let [can_render, can_simulate] = virtual_can_render_simulate? virtual_can_render_simulate(): [true, true],
        has_controls,
        delta = clock.getDelta(),
        epsilon = 0;

    if (!can_render)
        is_paused = true;

    if (next_paused && delta * SIMULATION_HZ > 1)
        delta = 1 / SIMULATION_HZ;
    else if (delta > 0.05)
        delta = 0.05;

    // moved the camera with the mouse?
    if (controls) {
        controls.enabled = (is_paused || camera_id == 'static') && !is_overlay_visible();
        if (controls.enabled) {
            has_controls = controls.update(delta);
            if (has_controls) {
                if (is_paused || camera_id == 'static') {
                    camera_pos.copy(camera.position);
                    next_paused = false;
                }
                if (!(dirty & 4))
                    dirty = 2;
            }
        }
    }

    debugs.fps = [delta, (delta > 0)? 1.0/delta: 0];

    if (!cube)
        return;

    if (stats)
        stats.begin();

    if (can_render) {
        if (!is_paused)
            dirty = 6;
        else if (!has_controls)
            dirty = 0;

        if (can_simulate) {
            if (virtual_pre_simulation)
                virtual_pre_simulation();
            gamepad_update();

            if (!is_paused) {
                update_time(delta);

                let step = 0;
                clock2.start();

                while (deltas[1] + 0.05 / SIMULATION_HZ < now2) {
                    if (virtual_animate_scenery)
                        virtual_animate_scenery();

                    // objects
                    for (let cube of cubes) {
                        interpolate_store(cube);
                        for (let part of PARTS)
                            interpolate_store(cube[part]);

                        // game step
                        if (virtual_simulate_object)
                            virtual_simulate_object(cube);
                    }

                    // camera
                    interpolate_store(camera);
                    if (virtual_update_camera)
                        virtual_update_camera(camera_target);

                    if (camera_id != 'static') {
                        camera.position.copy(camera_pos);
                        camera.lookAt(camera_look);
                    }

                    frame ++;
                    deltas[1] = frame / SIMULATION_HZ;
                    step ++;
                }
                STEPS[step] = (STEPS[step] || 0) + 1;

                if (is_octo)
                    update_physics(delta);
                else
                    epsilon = (deltas[1] - now2) * SIMULATION_HZ;

                if (step > 0) {
                    if (sim_times.length > 1200)
                        sim_times.shift();
                    sim_times.push(clock2.getDelta() / step);
                    let sim_time = sim_times.reduce((a, b) => a + b);
                    debugs.sim_time = `${sim_times.length} : ${Format(sim_time * 1000 / sim_times.length)}ms`;
                }
            }

            if (virtual_post_simulation)
                virtual_post_simulation();
        }
    }

    // has the camera moved?
    old_pos.sub(camera.position);
    old_rot.sub(camera.rotation);
    if (dirty < 2 || camera.dirty) {
        dirty = (old_pos.lengthSq() > 1e-5 || old_rot.lengthSq() > 1e-5) * 1;
        camera.dirty = dirty;
    }
    old_pos.copy(camera.position);
    old_rot.copy(camera.rotation);

    // render
    if (!(dirty & 4) && dirty > 1)
        dirty --;
    if (dirty) {
        // interpolate?
        if (epsilon > 0) {
            for (let cube of cubes) {
                interpolate(cube, epsilon);
                for (let part of PARTS)
                    interpolate(cube[part], epsilon);
            }
            interpolate(camera, epsilon);
        }

        update_light();

        // actual render
        if (virtual_pre_render)
            virtual_pre_render();
        renderer.render(scene, camera);
        rendered ++;
        if (virtual_post_render)
            virtual_post_render();

        // undo interpolation
        if (epsilon > 0) {
            for (let cube of cubes) {
                interpolate_restore(cube);
                for (let part of PARTS)
                    interpolate_restore(cube[part]);
            }
            interpolate_restore(camera);
        }

        // pause next frame?
        if (next_paused && !camera.dirty) {
            if (controls)
                controls.enabled = true;
            dirty = 0;
            is_paused = true;
        }

        if (virtual_game_actions)
            virtual_game_actions();
    }

    if (stats)
        stats.end();

    if (dirty)
        AnimationFrame(render);
}

/**
 * Request a render
 * @param {Object|number=} timer
 */
function request_render(timer) {
    if (dirty & 4)
        return;
    if (dirty && (!timer || isNaN(timer)))
        return;
    dirty = 2;
    AnimationFrame(render);
}

/**
 * Resize the 3D engine
 * + create the camera
 * + create the camera controls
 */
function resize_3d() {
    if (!three_loaded)
        return;

    let parent = _(PARENT_3D),
        height = parent.clientHeight,
        width = parent.clientWidth;

    if (virtual_resize_3d_special)
        [width, height] = virtual_resize_3d_special();

    // round it to multiple of 10
    width -= 5;
    width += (10 - width % 10);

    if (renderer) {
        renderer.setSize(width, height);
        update_renderer();
    }

    // camera + controls
    if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    else {
        // camera = new T.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.01, 2048576);
        camera = new T.PerspectiveCamera(60, width / height, 0.1, 40000);
        camera.rotation.reorder('ZXY');

        if (virtual_random_position)
            camera.position.copy(virtual_random_position(1));
        set_camera_id('static');

        Assign(camera, {
            pos2: camera.position.clone(),
            pos3: camera.position.clone(),
            quat: new_quaternion(),
            quat2: new_quaternion(),
            quat3: new_quaternion(),
        });
    }
    camera.height = height;
    camera.width = width;

    if (renderer && !controls && use_controls) {
        let CameraControls = window.CameraControls;
        CameraControls.install({T: T, THREE: T});
        controls = new CameraControls(camera, renderer.domElement);
        controls.dampingFactor = 0.1;
        controls.dollyTransition = true;
        controls.addEventListener('control', () => request_render());
        controls.addEventListener('controlstart', () => request_render());
        controls.update();
    }
}

/**
 * Set controls to the current camera
 * @param {boolean} pause
 * @param {Vector3} target
 * @param {boolean=} transition
 */
function set_camera_control(pause, target, transition) {
    if (pause)
        next_paused = pause;
    if (controls) {
        controls.updateCameraUp();
        // change pivot
        if (target) {
            let dir = t_vector.subVectors(target, camera_pos),
                line = t_vector2.subVectors(camera_look, camera_pos);
            target = dir.projectOnVector(line).add(camera_pos);
        }
        else if (target == 0)
            target = t_vector.subVectors(camera_look, camera_pos).normalize().add(camera_pos);
        else
            target = camera_look;
        controls.setLookAt(camera_pos.x, camera_pos.y, camera_pos.z, target.x, target.y, target.z, transition);
    }
    camera_control = true;
}

/**
 * Set the camera view
 * @param {string=} id
 * @param {boolean=} auto was set automatically, not manually
 */
function set_camera_id(id, auto) {
    // default value
    if (!id) {
        id = Y.camera_id;
        if (!CAMERAS[id])
            id = 'far';
    }

    // remember a good camera view
    let bads = {reverse: 1};
    for (let id2 of [id, camera_id])
        if (!bads[id2]) {
            camera_id2 = id2;
            break;
        }

    // change the camera view
    camera_id = id;
    save_option('camera_id', id);
    if (!auto) {
        camera_auto = 0;
        camera_reverse = false;
    }
}

/**
 * Update the light target
 */
function update_light() {
    let camera_forward = t_vector.copy(VECTOR_Z).negate().applyQuaternion(camera.quaternion);
    if (light_target)
        light_target.position.copy(camera.position).addScaledVector(camera_forward, light_main.shadow.camera.right);
}

/**
 * Update the light shadow settings
 */
function update_light_settings() {
    if (!light_main)
        return;

    let exists = light_main.quality,
        [main_intensity, under_intensity, quality] =
        virtual_update_light_settings_special? virtual_update_light_settings_special(): [1, 1, Y['shadow']];

    light_main.intensity = main_intensity;
    light_main.castShadow = !!quality;
    light_main.target = light_target;
    if (light_under)
        light_under.intensity = under_intensity;

    if (exists) {
        // no change => return
        if (exists == quality)
            return;
        else {
            // HACK: remove the old light + create a new one
            scene.remove(light_main);
            light_main = create_light(quality);
            scene.add(light_main);
        }
    }

    let [radius, range, size] = SHADOW_QUALITIES[quality] || SHADOW_QUALITIES.off,
        shadow = light_main.shadow;
    Assign(shadow.camera, {
        bottom: -range,
        far: 3333,
        left: -range,
        near: 83,
        right: range,
        top: range,
    });

    shadow.mapSize.height = size;
    shadow.mapSize.width = size;
    shadow.radius = radius;
    light_main.quality = quality;
}

/**
 * Update some renderer settings depending on the page
 */
function update_renderer() {
    if (renderer) {
        let ratio = 4;
        if (y_x == 'play')
            ratio = DefaultInt((Y['resolution'] || '').split(':').slice(-1)[0], 2);

        if (three_loaded)
            renderer.outputEncoding = T[`${Y['encoding']}Encoding`] || T.sRGBEncoding;
        renderer.toneMappingExposure = Y['exposure'];
        renderer.gammaFactor = Y['gamma'];
        renderer.setPixelRatio(window.devicePixelRatio / ratio);
        renderer.shadowMap.enabled = !!Y['shadow'];
    }
    update_light_settings();

    if (virtual_update_renderer_special)
        virtual_update_renderer_special();
}

/**
 * Synchronise the time
 * @param {number} delta
 */
function update_time(delta) {
    deltas[0] += delta * SIMULATION_HZ / 60;
    deltas[2] += delta;
    now = deltas[0];
    now2 = deltas[2];
}

// PHYSICS
//////////

/**
 * Convert a btQuaternion to Quaternion
 * @param {!Object} quaternion
 * @param {Object=} target
 * @returns {!Object}
 */
function three_quat(quaternion, target) {
    target = target || t_quat;
    target.set(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w());
    return target;
}

/**
 * Convert a bVector3 to T.Vector3
 * @param {!Object} vector
 * @param {Vector3=} target
 * @returns {Vector3}
 */
function three_vector(vector, target) {
    target = target || t_vector;
    target.set(vector.x(), vector.y(), vector.z());
    return target;
}

/**
 * Update physics
 * @param {number} delta
 **/
function update_physics(delta) {
    if (!world)
        return;

    // step simulation
    world.stepSimulation(delta, 10);

    // update bodies
    for (let body of bodies) {
        if (!body)
            continue;
        let obj_ammo = body.body,
            state = obj_ammo.getMotionState();
        if (!state)
            continue;

        state.getWorldTransform(world_transform);
        let pos = world_transform.getOrigin(),
            quat = world_transform.getRotation();
        three_vector(pos, body.position);
        three_quat(quat, body.quaternion);
    }
}

// INPUT / OUTPUT
/////////////////

/**
 * Check gamepad inputs
 */
function gamepad_update() {
    let gamepads = navigator.getGamepads(),
        time = is_paused? Now(true): now;

    for (let pad of gamepads) {
        if (!pad || pad.index != gamepad_id)
            continue;

        if (vibration) {
            pad.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: 100,
                weakMagnitude: 0.1,
                strongMagnitude: 1.0
            });
            vibration = false;
        }

        // convert buttons to binary KEYS
        pad.buttons.forEach((button, id) => {
            let code = BUTTON_MAPPING[id];
            if (button.pressed) {
                if (!buttons[id]) {
                    if (virtual_game_action_key)
                        virtual_game_action_key(code);
                    buttons[id] = time;
                    KEYS[code] = 1;
                    KEY_TIMES[code] = Now(true);
                }
            }
            else if (buttons[id]) {
                if (virtual_game_action_keyup)
                    virtual_game_action_keyup(code);
                buttons[id] = 0;
                KEYS[code] = 0;
            }
        });

        // convert axes to analog KEYS
        pad.axes.forEach((axis, id) => {
            let absolute = Abs(axis),
                codes = AXIS_MAPPING[id],
                index = (axis < 0)? 0: 1;

            if (absolute > AXIS_DEAD_ZONE) {
                if (Abs(axes[id]) < AXIS_DEAD_ZONE)
                    if (virtual_game_action_key)
                        virtual_game_action_key(codes[index]);
                KEYS[codes[index]] = absolute;
                KEYS[codes[1 - index]] = 0;
            }
            else {
                if (Abs(axes[id]) >= AXIS_DEAD_ZONE) {
                    if (virtual_game_action_keyup)
                        virtual_game_action_keyup(codes[index]);
                    KEYS[codes[0]] = 0;
                    KEYS[codes[1]] = 0;
                }
            }
        });
        axes = pad.axes;
    }
}

/**
 * Play a sound
 * @param {Cube} cube
 * @param {string} name
 * @param {Object} obj
 * @param {string=} obj._ filename
 * @param {string=} obj.ext
 * @param {number=} obj.cycle end of the cycle
 * @param {boolean=} obj.inside
 * @param {boolean=} obj.interrupt play the sound again even if it's being played
 * @param {Function=} obj.loaded only load the audio
 * @param {number=} obj.start start of the 2nd cycle
 * @param {boolean=} obj.voice
 * @param {number=} obj.volume
 * @returns {boolean}
 */
function play_sound(cube, name, {_, cycle, ext='ogg', inside, interrupt, loaded, start=0, voice, volume=1}={}) {
    if (!cube || !cube.sounds || !name)
        return false;

    // ext can be in the name
    let items = name.split('.');
    if (items.length == 1)
        name = `${name}.${ext}`;

    let audio = cube.sounds[name];
    // already played the same sound this frame => skip
    if (audio && frame && audio.frame == frame)
        return false;

    // play sounds weaker depending on the distance
    // - distance between 2 segments is ~1500 units
    // http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiJleHAoLXgqMC4xOCkqMC42IiwiY29sb3IiOiIjMDAwMDAwIn0seyJ0eXBlIjoxMDAwLCJ3aW5kb3ciOlsiMCIsIjMwIiwiMCIsIjEiXSwiZ3JpZCI6WyIxIiwiMC4xIl19XQ--
    if (!voice || !cube.see)
        if (!isNaN(cube.camera))
            volume *= Exp(-cube.camera * 0.0072);

    volume *= Y['volume'] / 10;
    if ((inside || voice) && !cube.see)
        volume *= 0.05;

    // negative volume to stop
    if (volume < 0.001) {
        if (audio)
            audio.pause();
        return false;
    }

    // load & seek
    if (!audio) {
        audio = new Audio(`sound/${_ || name}`);
        audio.promise = Promise.resolve();
        cube.sounds[name] = audio;
    }
    else if (interrupt || (!audio.ended && cycle && audio.currentTime > cycle * audio.duration)) {
        audio.pause();
        audio.currentTime = start;
    }

    // set frame + volume
    audio.frame = frame;
    if (volume >= 0 && volume < 1)
        audio.volume = volume;

    // only load, don't play
    if (loaded) {
        if (audio.readyState >= 2)
            loaded();
        else
            audio.onloadeddata = loaded;
        return true;
    }

    // play
    audio.promise = audio.promise.then(() => {
        return Promise.resolve(audio.play());
    })
    .catch(() => {
        audio.pause();
    });
    return true;
}

// UI
/////

/**
 * Check gamepad inputs at regular intervals when the menu is visible
 */
function gamepad_modal() {
    if (!is_overlay_visible()) {
        [37, 38, 39, 40].forEach(code => {
            KEYS[code] = 0;
        });
        return;
    }

    // forget old buttons
    let time = Now(true);
    Keys(buttons).forEach(key => {
        let button = buttons[key];
        if (!button)
            return;

        let code = BUTTON_MAPPING[key];
        if (code < 37 || code > 40)
            return;

        let repeat = (key == button_repeat && time < button_repeat_time)? 0: 0.5;
        if (time > button + repeat) {
            buttons[key] = 0;
            button_repeat = key;
            button_repeat_time = time + 0.1;
        }
    });

    gamepad_update();
    add_timeout('pad', gamepad_modal, 50);
}

/**
 * Check if the overlay is visible
 * @returns {boolean}
 */
function is_overlay_visible() {
    return !!Visible(CacheId('overlay'));
}

/**
 * Close the modal and resume the game
 */
function resume_game() {
    is_paused = false;
    if (is_overlay_visible())
        show_modal();
}

/**
 * Show the menu
 * + pause the game unless the session has ended
 */
function show_menu() {
    show_modal(true);
}

/**
 * Show / hide the modal
 * @param {boolean=} show
 * @param {string=} text show modal2 instead of modal, and use this text
 * @param {string=} title set the modal2 title
 * @param {string=} name
 */
function show_modal(show, text, title, name) {
    S(CacheId('overlay'), show);

    let node = CacheId('modal');
    if (IsString(text)) {
        Attrs(CacheId('modal-title'), {'data-t': title? title: ''});
        HTML(node, text);
        translate_nodes(node);
    }

    Style(node, [['opacity', show? 1: 0]]);

    let node2 = CacheId('modal2');
    Style(node2, [['display', show? 'block': 'none']]);

    if (show) {
        add_timeout('pad', gamepad_modal, 300);
        set_modal_events();
        if (virtual_game_action_key)
            virtual_game_action_key();
    }
    else
        clear_timeout('pad');

    if (virtual_show_modal_special)
        virtual_show_modal_special(show);

    modal_name = name;
}

/**
 * Update debug information
 */
function update_debug() {
    // general
    let lines = [],
        sep = ' : ';

    // gamepad
    if (DEV['input']) {
        lines.push('&nbsp;');
        lines.push(`id=${gamepad_id}`);
        lines.push(`axes=${Format(axes, sep)}`);
        let text = Keys(buttons).map(key => `${buttons[key]? `${key} `: ''}`).join('');
        lines.push(`buttons=${text}`);
        text = [37, 38, 39, 40].map(code => KEYS[code]);
        lines.push(`KEYS=${Format(text, sep)}`);
    }

    // debugs
    if (DEV['debug']) {
        let debug_keys = Keys(debugs).sort();
        if (debug_keys.length) {
            lines.push('&nbsp;');
            debug_keys.forEach(key => {
                lines.push(`${key}=${Format(debugs[key], sep)}`);
            });
        }
    }

    if (virtual_update_debug_special)
        lines = [...lines, ...virtual_update_debug_special()];

    HTML(CacheId('debug'), `<div>${lines.join('</div><div>')}</div>`);
}

// STARTUP
//////////

/**
 * 3d UI events
 */
function set_3d_events() {
    // controller
    Events(window, 'gamepadconnected', e => {
        let pad = e.gamepad;
        if (pad.buttons.length) {
            gamepads[pad.index] = pad;
            gamepad_id = pad.index;
        }
    });
    Events(window, 'gamepaddisconnected', e => {
        let pad = e.gamepad;
        delete gamepads[pad.index];
    });

    // game menu
    C('#menu', () => {
        if (is_overlay_visible())
            resume_game();
        else
            show_menu();
    });

    // modal
    C('#back', () =>  show_modal(true));
}

/**
 * Start the 3D engine
 */
function start_3d() {
    if (T)
        init_3d(true);
    else
        LoadLibrary('./js/4d_.js?version=1', () => init_3d(true));
}

/**
 * Initialise structures
 */
function startup_3d() {
    T = window.T = window.T || window.THREE || null;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// <<
if (typeof exports != 'undefined') {
    Assign(exports, {
        audiobox: audiobox,
        play_sound: play_sound,
        SHADOW_QUALITIES: SHADOW_QUALITIES,
    });
}
// >>
