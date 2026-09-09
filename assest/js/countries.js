// countries.js

const wait = setInterval(() => {

  if (!window.azziMap) return;

  clearInterval(wait);

  const { THREE, earth } = window.azziMap;

  const group = new THREE.Group();
  earth.add(group);

  const R = 1.012;

  function pos(lat, lon, r = R) {
    const p = THREE.MathUtils.degToRad(lat);
    const l = THREE.MathUtils.degToRad(lon);

    return new THREE.Vector3(
      r * Math.cos(p) * Math.sin(l),
      r * Math.sin(p),
      r * Math.cos(p) * Math.cos(l)
    );
  }

  function border(ring) {
    const points = [];

    ring.forEach(([lon, lat]) => {
      points.push(pos(lat, lon));
    });

    const geo = new THREE.BufferGeometry()
      .setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.75
    });

    return new THREE.LineLoop(geo, mat);
  }

  function label(text, lat, lon) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 512;
    canvas.height = 128;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#111827";
    ctx.fillText(text, 256, 64);

    const texture =
      new THREE.CanvasTexture(canvas);

    const material =
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: true
      });
const sprite =
      new THREE.Sprite(material);

    sprite.position.copy(
      pos(lat, lon, 1.035)
    );

    sprite.scale.set(
      0.16,
      0.04,
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

        const name =
          country.properties.ADMIN ||
          country.properties.NAME ||
          country.properties.name;

        const geometry =
          country.geometry;

        if (!geometry) return;

        if (geometry.type === "Polygon") {

          geometry.coordinates.forEach(ring => {
            group.add(border(ring));
          });

        }

        if (geometry.type === "MultiPolygon") {

          geometry.coordinates.forEach(polygon => {

            polygon.forEach(ring => {
              group.add(border(ring));
            });

          });

        }
const c =
          country.properties?.LABEL_X &&
          country.properties?.LABEL_Y
            ? [
                country.properties.LABEL_X,
                country.properties.LABEL_Y
              ]
            : null;

        if (c) {
          label(name, c[1], c[0]);
        }

      });

    });

}, 100);
