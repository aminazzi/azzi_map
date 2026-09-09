// assest/js/countries.js

const wait = setInterval(() => {

  if (!window.azziMap) return;
  clearInterval(wait);

  const { THREE, earth } = window.azziMap;
  const group = new THREE.Group();
  earth.add(group);

  const R = 1.015;

  function point(lat, lon, r = R) {
    const p = THREE.MathUtils.degToRad(lat);
    const l = THREE.MathUtils.degToRad(lon);

    return new THREE.Vector3(
      r * Math.cos(p) * Math.sin(l),
      r * Math.sin(p),
      r * Math.cos(p) * Math.cos(l)
    );
  }

  function line(ring) {
    const points = ring.map(([lon, lat]) =>
      point(lat, lon)
    );

    const geometry =
      new THREE.BufferGeometry().setFromPoints(points);

    const material =
      new THREE.LineBasicMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.8
      });

    return new THREE.LineLoop(
      geometry,
      material
    );
  }
function center(feature) {

    const c = feature.geometry.coordinates;
    const ring =
      feature.geometry.type === "Polygon"
        ? c[0]
        : c[0][0];

    let lon = 0;
    let lat = 0;

    ring.forEach(([x, y]) => {
      lon += x;
      lat += y;
    });

    return [
      lat / ring.length,
      lon / ring.length
    ];
  }

  function label(text, lat, lon) {

    const canvas =
      document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 100;

    const ctx =
      canvas.getContext("2d");

    ctx.clearRect(
      0, 0,
      canvas.width,
      canvas.height
    );

    ctx.font =
      "bold 30px Arial";

    ctx.fillStyle =
      "#111827";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      text,
      256,
      50
    );
const texture =
      new THREE.CanvasTexture(canvas);

    const sprite =
      new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false
        })
      );

    sprite.position.copy(
      point(lat, lon, 1.035)
    );

    sprite.scale.set(
      0.18,
      0.035,
      1
    );

    group.add(sprite);
  }

  fetch(
    "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
  )
  .then(r => r.json())
  .then(data => {

    data.features.forEach(country => {

      const geometry =
        country.geometry;

      if (!geometry) return;

      const name =
        country.properties.ADMIN ||
        country.properties.NAME ||
        country.properties.name;

      if (geometry.type === "Polygon") {

        geometry.coordinates.forEach(ring => {
          group.add(line(ring));
        });

      }
if (geometry.type === "MultiPolygon") {

        geometry.coordinates.forEach(polygon => {

          polygon.forEach(ring => {
            group.add(line(ring));
          });

        });

      }

      if (name) {

        const [lat, lon] =
          center(country);

        label(
          name,
          lat,
          lon
        );
      }

    });

  });

}, 100);
