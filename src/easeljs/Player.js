// O frango!
(function(window) {
    // Constantes para o movimento horizontal
    var MoveAcceleration = 13000.0;
    var MaxMoveSpeed = 1750.0;
    var GroundDragFactor = 0.48;
    var AirDragFactor = 0.58;

    // Constantes para o movimento vertical
    var MaxJumpTime = 0.35;
    var JumpLaunchVelocity = -5000.0;
    var GravityAcceleration = 1800.0;
    var MaxFallSpeed = 550.0;
    var JumpControlPower = 0.14;

    var globalTargetFPS = 17;

    var StaticTile = new Tile(null, Enum.TileCollision.Passable, 0, 0);

    // imgPlayer deve ser o png contendo a sequencia de sprites
    // level deve ser tipo de fase
    // position deve ser um ponto
    function Player(imgPlayer, level, position) {
        this.initialize(imgPlayer, level, position);
    }

    // Usar o BitmapSequence do EaselJS
    Player.prototype = new BitmapAnimation();

    Player.prototype.IsAlive = true;
    Player.prototype.HasReachedExit = false;

    // checa se o jogador está pisando no chão
    Player.prototype.IsOnGround = true;

    // construtor:
    Player.prototype.BitmapAnimation_initialize = Player.prototype.initialize;

    Player.prototype.initialize = function(imgPlayer, level, position) {
        var width;
        var left;
        var height;
        var top;
        var frameWidth;
        var frameHeight;


        var localSpriteSheet = new SpriteSheet({
            images: [imgPlayer], //imagem a ser usada 
            frames: { width: 64, height: 64, regX: 32, regY: 64 },
            animations: {
                walk: [0, 9, "walk", 4],
                die: [10, 21, false, 4],
                jump: [22, 32, false],
                celebrate: [33, 43, false, 4],
                idle: [44, 44]
                    //idle_h: [44, 44]
            }
        });

        SpriteSheetUtils.addFlippedFrames(localSpriteSheet, true, false, false);

        this.BitmapAnimation_initialize(localSpriteSheet);
        this.level = level;
        this.position = position;
        this.velocity = new Point(0, 0);
        this.previousBottom = 0.0;

        this.elapsed = 0;

        this.isJumping = false;
        this.wasJumping = false;
        this.jumpTime = 0.0;

        frameWidth = this.spriteSheet.getFrame(0).rect.width;
        frameHeight = this.spriteSheet.getFrame(0).rect.height;

        // Calcula os limites da textura. 
        width = parseInt(frameWidth * 0.4);
        left = parseInt((frameWidth - width) / 2);
        height = parseInt(frameWidth * 0.8);
        top = parseInt(frameHeight - height);
        this.localBounds = new XNARectangle(left, top, width, height);

        // Sombras
        if (enableShadows)
            this.shadow = new Shadow("#000", 3, 2, 2);

        this.name = "Hero";

        // 1 = direita   -1 = esquerda   0 = parado
        this.direction = 0;

        // começa diretamente no primeiro frame da sequencia de andar para direita
        this.currentFrame = 66;

        this.Reset(position);
    };

    // restora a vida do jogador
    /// <param name="position"> O ponto em que ele volta a vida
    Player.prototype.Reset = function(position) {
        this.x = position.x;
        this.y = position.y;
        this.velocity = new Point(0, 0);
        this.IsAlive = true;
        this.level.IsHeroDied = false;
        this.gotoAndPlay("idle");
        //this.gotoAndPlay("idle_h");
    };

    Player.prototype.BoundingRectangle = function() {
        var left = parseInt(Math.round(this.x - 32) + this.localBounds.x);
        var top = parseInt(Math.round(this.y - 64) + this.localBounds.y);

        return new XNARectangle(left, top, this.localBounds.width, this.localBounds.height);
    };

    /// Input, fisica e animações
    Player.prototype.tick = function() {
        this.elapsed = globalTargetFPS / 1000;

        this.ApplyPhysics();

        if (this.IsAlive && this.IsOnGround && !this.HasReachedExit) {
            if (Math.abs(this.velocity.x) - 0.02 > 0) {
                // Ver se já está com a animação de andar
                if (this.currentAnimation.indexOf("walk") === -1 && this.direction === -1) {
                    this.gotoAndPlay("walk");
                    sessionStorage.setItem("animacao", "idle");
                }
                if (this.currentAnimation.indexOf("walk_h") === -1 && this.direction === 1) {
                    this.gotoAndPlay("walk_h");
                    sessionStorage.setItem("animacao", "idle_h");
                }
            } else {
                this.gotoAndPlay(sessionStorage.getItem("animacao"));
            }
        }

        this.isJumping = false;
    };

    /// Atualizar a velocidade e posição do jogador baseado no input e gravidade
    Player.prototype.ApplyPhysics = function() {
        if (this.IsAlive && !this.HasReachedExit) {
            var previousPosition = new Point(this.x, this.y);

            // a velocidade base é uma combinação do movimento horizontal e da força da gravidade
            this.velocity.x += this.direction * MoveAcceleration * this.elapsed;
            this.velocity.y = Math.clamp(this.velocity.y + GravityAcceleration * this.elapsed, -MaxFallSpeed, MaxFallSpeed);

            this.velocity.y = this.DoJump(this.velocity.y);

            if (this.IsOnGround) {
                this.velocity.x *= GroundDragFactor;
            } else {
                this.velocity.x *= AirDragFactor;
            }

            // Impede que o jogador vá mais rapido que sua velocidade máxima
            this.velocity.x = Math.clamp(this.velocity.x, -MaxMoveSpeed, MaxMoveSpeed);

            this.x += this.velocity.x * this.elapsed;
            this.y += this.velocity.y * this.elapsed;
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);

            this.HandleCollisions();

            // Se uma colisão impedir o movimento, mude a velocidade pra zero
            if (this.x === previousPosition.x) {
                this.velocity.x = 0;
            }

            if (this.y === previousPosition.y) {
                this.velocity.y = 0;
            }
        }
    };

    /// Calcula a velocidade Y pro pulo e anima
    /// <param name="velocityY"> Velocidade no eixo Y do jogador
    Player.prototype.DoJump = function(velocityY) {
        if (this.isJumping) {
            // Começa ou continua o pulo
            if ((!this.wasJumping && this.IsOnGround) || this.jumpTime > 0.0) {
                if (this.jumpTime == 0.0) {
                    this.level.levelContentManager.playerJump.play();
                }

                this.jumpTime += this.elapsed;
                // Usa a animação correta de acordo com a direção do jogador

                if (this.direction == 1) {
                    this.gotoAndPlay("jump_h");
                } else {
                    this.gotoAndPlay("jump");
                }
            }

            // Na "subida" do pulo
            if (0.0 < this.jumpTime && this.jumpTime <= MaxJumpTime) {
                velocityY = JumpLaunchVelocity * (1.0 - Math.pow(this.jumpTime / MaxJumpTime, JumpControlPower));
            } else {
                // Chegou no ápice do pulo
                this.jumpTime = 0.0;
            }
        } else {
            // fim do pulo
            this.jumpTime = 0.0;
        }
        this.wasJumping = this.isJumping;

        return velocityY;
    };

    /// Detecta e resolve todas as colisões entre o jogador e os blocos.
    /// Os blocos com comportamento diferente tem uma logica especial.
    Player.prototype.HandleCollisions = function() {
        var bounds = this.BoundingRectangle();
        var leftTile = Math.floor(bounds.Left() / StaticTile.Width);
        var rightTile = Math.ceil((bounds.Right() / StaticTile.Width)) - 1;
        var topTile = Math.floor(bounds.Top() / StaticTile.Height);
        var bottomTile = Math.ceil((bounds.Bottom() / StaticTile.Height)) - 1;

        // flag pra checar colisão com o chão
        this.IsOnGround = false;

        // Para cada bloco potencialmente colidindo
        for (var y = topTile; y <= bottomTile; ++y) {
            for (var x = leftTile; x <= rightTile; ++x) {
                // Se esse bloco é "colidível",
                var collision = this.level.GetCollision(x, y);
                if (collision !== Enum.TileCollision.Passable) {
                    // Determina a profundidade, direção e magnitude da colisão
                    var tileBounds = this.level.GetBounds(x, y);
                    var depth = bounds.GetIntersectionDepth(tileBounds);
                    if (depth.x !== 0 && depth.y !== 0) {
                        var absDepthX = Math.abs(depth.x);
                        var absDepthY = Math.abs(depth.y);

                        // Resolve a colisão no eixo raso
                        if (absDepthY < absDepthX || collision == Enum.TileCollision.Platform) {
                            // Se cruzou com o topo de um bloco, está no chão
                            if (this.previousBottom <= tileBounds.Top()) {
                                this.IsOnGround = true;
                            }

                            // Ignorar plataformas, exceto quando estiver no chão

                            if (collision == Enum.TileCollision.Impassable || this.IsOnGround) {
                                // Resolve a colisão no eixo Y
                                this.y = this.y + depth.y;

                                bounds = this.BoundingRectangle();
                            }
                        } else if (collision == Enum.TileCollision.Impassable) // Ignora plataformas
                        {
                            // Resolve a colisão no eixo X
                            this.x = this.x + depth.x;

                            bounds = this.BoundingRectangle();
                        }
                    }
                }
            }
        }

        this.previousBottom = bounds.Bottom();
    };

    /// chamado quando o jogador morre
    /// <param name="killedBy"> O inimigo que matou o jogador. Nulo quando caiu em buraco
    Player.prototype.OnKilled = function(killedBy) {
        this.IsAlive = false;
        this.velocity = new Point(0, 0);

        // Usar animação apropriada baseado na direção do jogador
        if (this.direction === 1) {
            this.gotoAndPlay("die_h");
        } else {
            this.gotoAndPlay("die");
        }

        if (killedBy !== null && killedBy !== undefined) {
            this.level.levelContentManager.playerKilled.play();
        } else {
            this.level.levelContentManager.playerFall.play();
        }
    };

    /// Chamado quando o jogador completa a fase
    Player.prototype.OnReachedExit = function() {
        this.HasReachedExit = true;
        this.level.levelContentManager.exitReached.play();

        // Usar animação apropriada baseado na direção do jogador
        if (this.direction === 1) {
            this.gotoAndPlay("celebrate_h");
        } else {
            this.gotoAndPlay("celebrate");
        }
    };

    window.Player = Player;
}(window));