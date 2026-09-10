/* =========================================
   AZZI WORLD
   JavaScript متوافق مع index.html الأول
   ========================================= */

const container = document.getElementById("globe");

if (!container) {
    console.error("لم يتم العثور على #globe");
} else {


/* =========================================
   SCENE
   ========================================= */

const scene = new THREE.Scene();

scene.background =
    new THREE.Color(0xffffff);


/* =========================================
   CAMERA
   ========================================= */

const camera =
    new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

camera.position.set(0, 0, 3);


/* =========================================
   RENDERER
   ========================================= */

const renderer =
    new THREE.WebGLRenderer({
        antialias: true
    });

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

container.appendChild(
    renderer.domElement
);
/* =========================================
   CONTROLS
   ========================================= */

const controls =
    new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.enablePan = false;

controls.minDistance = 1.5;
controls.maxDistance = 5;


/* =========================================
   إضاءة أقوى
   ========================================= */

const ambient =
    new THREE.AmbientLight(
        0xffffff,
        2.8
    );

scene.add(ambient);


const light =
    new THREE.DirectionalLight(
        0xffffff,
        4
    );

light.position.set(
    5,
    4,
    6
);

scene.add(light);


const frontLight =
    new THREE.DirectionalLight(
        0xffffff,
        2
    );

frontLight.position.set(
    -4,
    2,
    5
);

scene.add(frontLight);
/* =========================================
   الكرة الأرضية
   ========================================= */

const earth =
    new THREE.Mesh(

        new THREE.SphereGeometry(
            1,
            96,
            96
        ),

        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 10
        })

    );

scene.add(earth);


/* =========================================
   صورة الأرض
   ========================================= */

const textureLoader =
    new THREE.TextureLoader();

textureLoader.load(

    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",

    function(texture) {

        texture.encoding =
            THREE.sRGBEncoding;

        earth.material.map =
            texture;

        earth.material.color.set(
            0xffffff
        );

        earth.material.needsUpdate =
            true;

    },

    undefined,

    function() {

        earth.material.color.set(
            0x4c9ed0
        );

    }
);
/* =========================================
   مجموعات الحدود والأسماء
   ========================================= */

const borders =
    new THREE.Group();

const labels =
    new THREE.Group();

earth.add(borders);
earth.add(labels);


/*
   لا نضع الحدود بعيداً عن الكرة.
   هذا يجعلها تبدو ملتصقة بسطح الدول.
*/

const BORDER_RADIUS = 1.003;

const LABEL_RADIUS = 1.018;


/* =========================================
   تحويل إحداثيات GeoJSON
   إلى سطح الكرة
   ========================================= */

function geoPoint(
    lon,
    lat,
    radius
) {

    const phi =
        lat * Math.PI / 180;

    const theta =
        lon * Math.PI / 180;


    return new THREE.Vector3(

        radius *
        Math.cos(phi) *
        Math.cos(theta),

        radius *
        Math.sin(phi),

        -radius *
        Math.cos(phi) *
        Math.sin(theta)

    );
}
/* =========================================
   اسم الدولة
   ========================================= */

function getName(feature) {

    const p =
        feature.properties || {};

    return (
        p.ADMIN ||
        p.NAME ||
        p.NAME_EN ||
        p.name ||
        p.SOVEREIGNT ||
        ""
    );
}


/* =========================================
   رمز الدولة
   ========================================= */

function getISO(feature) {

    const p =
        feature.properties || {};

    return String(

        p.ISO_A3 ||
        p.ADM0_A3 ||
        p.ISO3 ||
        ""

    ).toUpperCase();
}


/* =========================================
   المغرب + الصحراء الغربية
   في مجموعة واحدة
   ========================================= */

function getCountryKey(feature) {

    const name =
        getName(feature)
        .toLowerCase();

    const iso =
        getISO(feature);


    if (
        iso === "MAR" ||
        name === "morocco"
    ) {
        return "MAR";
    }


    if (
        iso === "ESH" ||
        name.includes("western sahara")
    ) {
        return "MAR";
    }


    return iso || name;
}
/* =========================================
   رسم حلقة حدود
   ========================================= */

function drawRing(ring) {

    if (
        !ring ||
        ring.length < 2
    ) {
        return;
    }


    const points = [];


    for (
        let i = 0;
        i < ring.length;
        i++
    ) {

        const lon =
            ring[i][0];

        const lat =
            ring[i][1];


        points.push(

            geoPoint(
                lon,
                lat,
                BORDER_RADIUS
            )

        );

    }


    points.push(
        points[0].clone()
    );


    const geometry =
        new THREE.BufferGeometry()
        .setFromPoints(points);


    const material =
        new THREE.LineBasicMaterial({

            color: 0x172033,

            transparent: true,

            opacity: 0.95,

            depthTest: true,

            depthWrite: false

        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    borders.add(line);
}
/* =========================================
   Polygon / MultiPolygon
   ========================================= */

function drawGeometry(geometry) {

    if (
        geometry.type === "Polygon"
    ) {

        geometry.coordinates.forEach(
            ring => {
                drawRing(ring);
            }
        );

    }


    if (
        geometry.type === "MultiPolygon"
    ) {

        geometry.coordinates.forEach(
            polygon => {

                polygon.forEach(
                    ring => {
                        drawRing(ring);
                    }
                );

            }
        );

    }
}


/* =========================================
   إنشاء اسم الدولة
   ========================================= */

function createLabel(
    name,
    lon,
    lat
) {

    if (!name) {
        return;
    }


    const canvas =
        document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 96;


    const ctx =
        canvas.getContext("2d");


    let size = 28;


    if (name.length > 18) {
        size = 22;
    }

    if (name.length > 28) {
        size = 18;
    }


    ctx.font =
        "bold " +
        size +
        "px Arial";


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";
/* حدود بيضاء */

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 8;


    ctx.strokeText(
        name,
        256,
        48
    );


    /* النص */

    ctx.fillStyle =
        "#111827";


    ctx.fillText(
        name,
        256,
        48
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    const material =
        new THREE.SpriteMaterial({

            map: texture,

            transparent: true,

            depthTest: false,

            depthWrite: false

        });


    const sprite =
        new THREE.Sprite(
            material
        );


    sprite.position =
        geoPoint(
            lon,
            lat,
            LABEL_RADIUS
        );


    sprite.scale.set(
        0.30,
        0.056,
        1
    );


    sprite.renderOrder = 1000;


    labels.add(sprite);
}
/* =========================================
   إيجاد مركز تقريبي للدولة
   ========================================= */

function getCenter(feature) {

    const geometry =
        feature.geometry;


    let ring = null;


    if (
        geometry.type === "Polygon"
    ) {

        ring =
            geometry.coordinates[0];

    }


    if (
        geometry.type === "MultiPolygon"
    ) {

        let largest = null;
        let length = 0;


        geometry.coordinates.forEach(
            polygon => {

                const r =
                    polygon[0];


                if (
                    r &&
                    r.length > length
                ) {

                    length =
                        r.length;

                    largest =
                        r;

                }

            }
        );


        ring = largest;
    }


    if (
        !ring ||
        !ring.length
    ) {

        return null;

    }


    let lon = 0;
    let lat = 0;


    ring.forEach(
        p => {

            lon += p[0];
            lat += p[1];

        }
    );


    return {

        lon:
            lon / ring.length,

        lat:
            lat / ring.length

    };
}
/* =========================================
   تحميل GeoJSON
   ========================================= */

fetch(

    "https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson"

)

.then(
    response => {

        if (!response.ok) {
            throw new Error(
                "GeoJSON error"
            );
        }

        return response.json();

    }
)

.then(
    data => {


        const countries = {};


        /* تجميع الدول */

        data.features.forEach(
            feature => {

                if (!feature.geometry) {
                    return;
                }


                const key =
                    getCountryKey(feature);


                if (!countries[key]) {

                    countries[key] = {

                        name:
                            getName(feature),

                        features: []

                    };

                }


                countries[key]
                    .features
                    .push(feature);

            }
        );


        /* رسم الحدود والأسماء */

        Object.keys(countries)
        .forEach(
            key => {

                const country =
                    countries[key];


                /* الحدود */

                country.features.forEach(
                    feature => {

                        drawGeometry(
                            feature.geometry
                        );

                    }
                );
/* اسم المغرب */

                if (
                    key === "MAR"
                ) {

                    createLabel(
                        "Morocco",
                        -6.2,
                        31.8
                    );

                    return;
                }


                /* أسماء باقي الدول */

                const center =
                    getCenter(
                        country.features[0]
                    );


                if (center) {

                    createLabel(

                        country.name,

                        center.lon,

                        center.lat

                    );

                }

            }
        );

    }
)

.catch(
    error => {

        console.error(
            "Map error:",
            error
        );

    }
);


/* =========================================
   إخفاء أسماء الدول الموجودة خلف الكرة
   ========================================= */

const cameraNormal =
    new THREE.Vector3();

const worldPosition =
    new THREE.Vector3();


function updateLabels() {

    cameraNormal
        .copy(camera.position)
        .normalize();


    labels.children.forEach(
        label => {

            label.getWorldPosition(
                worldPosition
            );
worldPosition.normalize();


            label.visible =
                worldPosition.dot(
                    cameraNormal
                ) > 0.05;

        }
    );
}


/* =========================================
   تشغيل الخريطة
   ========================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    controls.update();

    updateLabels();


    renderer.render(
        scene,
        camera
    );
}


animate();


/* =========================================
   تغيير حجم الشاشة
   ========================================= */

window.addEventListener(
    "resize",
    function() {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);

}
