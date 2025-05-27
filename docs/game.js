
kaboom({
  width: 320,
  height: 240,
  scale: 2,
  background: [0, 0, 0],
});

// --- Load Sprites ---
loadSprite("tiles", "assets/tiles.png", {
  sliceX: 8,
  sliceY: 8,
});
loadSprite("player", "assets/player.png", {
  sliceX: 3,
  anims: {
    idle: 0,
    walk: { from: 0, to: 2, speed: 6, loop: true },
  },
});
loadSprite("enemy", "assets/enemy.png", {
  sliceX: 3,
});
loadSprite("boss", "assets/boss.png");

// --- Save/Load ---
function saveData(level, hp) {
  localStorage.setItem("save", JSON.stringify({ level, hp }));
}

function loadData() {
  const raw = localStorage.getItem("save");
  if (!raw) return null;
  return JSON.parse(raw);
}

// --- Generate level map ---
function generateLevel(w, h) {
  const map = [];
  for (let y = 0; y < h; y++) {
    let row = "";
    for (let x = 0; x < w; x++) {
      if (y === 0 || y === h - 1 || x === 0 || x === w - 1 || Math.random() < 0.1) {
        row += "a";
      } else {
        row += ".";
      }
    }
    map.push(row);
  }
  map[1] = map[1].substring(0, 1) + "p" + map[1].substring(2, w - 2) + ">";
  return map;
}

// --- Scene: Menu ---
scene("menu", () => {
  add([
    text("ТЕМНИЦА
Призрачного Лорда", { size: 16, align: "center" }),
    pos(center()),
    anchor("center")
  ]);
  add([
    text("Нажми [Enter] чтобы начать", { size: 8 }),
    pos(center().x, center().y + 60),
    anchor("center")
  ]);
  onKeyPress("enter", () => {
    const saved = loadData();
    if (saved) {
      go("game", saved.level, saved.hp);
    } else {
      go("game", 0, 3);
    }
  });
  onKeyPress("r", () => {
    localStorage.removeItem("save");
    go("menu");
  });
});

// --- Scene: Game ---
scene("game", (levelIndex = 0, hp = 3) => {
  const map = generateLevel(10, 8);

  const levelConfig = {
    width: 32,
    height: 32,
    "a": () => [sprite("tiles", { frame: 0 }), area(), solid()],
    ".": () => [sprite("tiles", { frame: 1 })],
    "p": () => [sprite("tiles", { frame: 1 }), "start"],
    ">": () => [sprite("tiles", { frame: 2 }), area(), "stair-down"],
  };

  const level = addLevel(map, levelConfig);

  const player = add([
    sprite("player"),
    pos(level.get("start")[0].pos),
    area(),
    solid(),
    "player",
  ]);

  const playerState = {
    hp: hp,
  };

  const hpText = add([
    text(`HP: ${playerState.hp}`),
    pos(8, 8),
    layer("ui")
  ]);

  function updateHP() {
    hpText.text = `HP: ${playerState.hp}`;
  }

  onKeyDown("left", () => { player.move(-100, 0); player.play("walk"); });
  onKeyDown("right", () => { player.move(100, 0); player.play("walk"); });
  onKeyDown("up", () => { player.move(0, -100); player.play("walk"); });
  onKeyDown("down", () => { player.move(0, 100); player.play("walk"); });
  onKeyRelease(() => player.play("idle"));

  for (let i = 0; i < levelIndex + 1; i++) {
    add([
      sprite("enemy"),
      pos(rand(40, 200), rand(40, 200)),
      area(),
      solid(),
      "enemy"
    ]);
  }

  if (levelIndex % 5 === 0 && levelIndex !== 0) {
    add([
      sprite("boss"),
      pos(160, 120),
      area(),
      solid(),
      "enemy"
    ]);
  }

  player.onCollide("enemy", (e) => {
    destroy(e);
    playerState.hp--;
    updateHP();
    if (playerState.hp <= 0) {
      go("menu");
    }
  });

  player.onCollide("stair-down", () => {
    saveData(levelIndex + 1, playerState.hp);
    go("game", levelIndex + 1, playerState.hp);
  });
});

go("menu");
