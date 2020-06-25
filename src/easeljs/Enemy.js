
/// Inimigo que mata ao tocar

(function (window) {
    /// Quanto ele espera antes de virar pro outro lado
    var MaxWaitTime = 0.5;

    /// A velocidade do inimigo no eixo x
    var MoveSpeed = 64.0;

    // Local bounds usada pra calcular a colisão com o jogador
    var localBounds;

    // Inice usado pra nomear os inimigos
    var monsterIndex = 0;

    var globalTargetFPS = 17;

    var StaticTile = new Tile(null, Enum.TileCollision.Passable, 0, 0);

    function Enemy(level, position, imgMonster) {
        this.initialize(level, position, imgMonster);
    };

    Enemy.prototype = new BitmapAnimation();

    // construtor:
    Enemy.prototype.BitmapAnimation_initialize = Enemy.prototype.initialize;    

    Enemy.prototype.initialize = function (level, position, imgMonster) {
        var width;
        var left;
        var height;
        var top;
        var frameWidth;
        var frameHeight;

        var localSpriteSheet = new SpriteSheet({
            images: [imgMonster], //imagem a ser usada
            frames: { width: 64, height: 64, regX: 32, regY: 64 },
            animations: {
                walk: [0, 9, "walk", 4],
                idle: [10, 20, "idle", 4]
            }
        });

        SpriteSheetUtils.addFlippedFrames(localSpriteSheet, true, false, false);

        this.BitmapAnimation_initialize(localSpriteSheet);

        this.x = position.x;
        this.y = position.y;
        this.level = level;

        /// quanto tempo este inimigo está esperando para virar
        this.waitTime = 0;

        frameWidth = this.spriteSheet.getFrame(0).rect.width;
        frameHeight = this.spriteSheet.getFrame(0).rect.height;

        // calcular limites do tamanho da textura
        width = parseInt(frameWidth * 0.35);
        left = parseInt((frameWidth - width) / 2);
        height = parseInt(frameWidth * 0.7);
        top = parseInt(frameHeight - height);
        localBounds = new XNARectangle(left, top, width, height);

        // começa a primeira sequencia
        this.gotoAndPlay("walk_h"); //animate

        // Sombra
        if (enableShadows)
            this.shadow = new Shadow("#000", 3, 2, 2);

        this.name = "Monster" + monsterIndex;
        monsterIndex++;

        /// Direção no eixo x
        // 1 = direita   -1 = Esquerda
        this.direction = 1;
        this.currentFrame = 21;
    };

    Enemy.prototype.BoundingRectangle = function () {
        var left = parseInt(Math.round(this.x - 32) + localBounds.x);
        var top = parseInt(Math.round(this.y - 64) + localBounds.y);

        return new XNARectangle(left, top, localBounds.width, localBounds.height);
    };

    /// Anda pra frente e pra tras nas plataformas
    Enemy.prototype.tick = function () {

        var elapsed = globalTargetFPS / 1000;

        var posX = this.x + (localBounds.width / 2) * this.direction;
        var tileX = Math.floor(posX / StaticTile.Width) - this.direction;
        var tileY = Math.floor(this.y / StaticTile.Height);

        if (this.waitTime > 0) {
            // Espera um pouquinho...
            this.waitTime = Math.max(0.0, this.waitTime - elapsed);
            if (this.waitTime <= 0.0 && !this.level.IsHeroDied && !this.level.ReachedExit) {
                // e se vira!
                this.direction = -this.direction;
                if (this.direction === 1) {
                    this.gotoAndPlay("walk_h"); //animate
                }
                else {
                    this.gotoAndPlay("walk"); //animate
                }

            }
        }
        else {
            // Caso acabe o espaço andavel.
            if (this.level.GetCollision(tileX + this.direction, tileY - 1) === Enum.TileCollision.Impassable
                || this.level.GetCollision(tileX + this.direction, tileY) === Enum.TileCollision.Passable
                || this.level.IsHeroDied || this.level.ReachedExit) {
                this.waitTime = MaxWaitTime;
                if (this.currentAnimation.indexOf("idle") === -1) {
                    this.gotoAndPlay("idle");
                }
            }
            else {
                // se move na direção atual
                var velocity = this.direction * MoveSpeed * elapsed;
                this.x = this.x + velocity;
            }
        }
    };

    window.Enemy = Enemy;
} (window));