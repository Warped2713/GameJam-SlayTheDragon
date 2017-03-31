//Sup.ArcadePhysics2D.setGravity(0, -0.02);

class PlayerBehavior extends Sup.Behavior {
  speed:number = 0.2;
  jumpSpeed:number = 0.42;
  
  private initialSize;
  private initialOffset;
  private allPlatformBodies: Sup.ArcadePhysics2D.Body[] = [];
  
  private controls;
  
  awake() {
    this.initialSize = this.actor.arcadeBody2D.getSize();
    this.initialOffset = this.actor.arcadeBody2D.getOffset();
    
    // Platform bodies
    let platformBodies = Sup.getActor("Platforms").getChildren();
    for (let platBody of platformBodies) this.allPlatformBodies.push(platBody.arcadeBody2D);
    
    // Init controls obj
    this.controls = {
      pressed: {
        left: false,
        right: false,
        jump: false,
        down: false,
        swap: false,
        use: false
      },
      held: {
        left: false,
        right: false,
        jump: false,
        down: false,
        swap: false,
        use: false
      }
    };
  }
  
  update() {
    
    // Store controls status so we only have to reduce N per update
    // Just Pressed
    this.controls.pressed.left = Controls.pressed("moveLeft");
    this.controls.pressed.right = Controls.pressed("moveRight");
    this.controls.pressed.jump = Controls.pressed("jump");
    this.controls.pressed.down = Controls.pressed("moveDown");
    this.controls.pressed.swap = Controls.pressed("swap");
    this.controls.pressed.use = Controls.pressed("use");
    // Held
    this.controls.held.left = Controls.held("moveLeft");
    this.controls.held.right = Controls.held("moveRight");
    this.controls.held.jump = Controls.held("jump");
    this.controls.held.down = Controls.held("moveDown");
    this.controls.held.swap = Controls.held("swap");
    this.controls.held.use = Controls.held("use");
    
    // Test Keyboad controls module
    //Sup.log(this.controls);
    
    // Check collision with solid bodies (from tilemap)
    Sup.ArcadePhysics2D.collides( this.actor.arcadeBody2D, Sup.getActor("Map").arcadeBody2D );
    //Sup.ArcadePhysics2D.collides(this.actor.arcadeBody2D, Sup.ArcadePhysics2D.getAllBodies());
    
    let touchSolids = this.actor.arcadeBody2D.getTouches().bottom;
    let velocity = this.actor.arcadeBody2D.getVelocity();
    let dampenFall = true;
    
    // If falling, check the semi-solid bodies
    let touchPlatforms = false;
    if ( velocity.y < 0 ) {
      // We must change the size of the player body so only the feet are checked
      // To do so, we reduce the height of the body and adapt the offset
      //this.actor.arcadeBody2D.setSize(this.initialSize.x, 0.4);
      //this.actor.arcadeBody2D.setOffset({ x: this.initialOffset.x, y: -0.8 });
      
      // Now, we check with every (semi-solid) platform
      // TODO: apply custom collision here so we can drop down
      for (let platformBody of this.allPlatformBodies) {
        Sup.ArcadePhysics2D.collides(this.actor.arcadeBody2D, platformBody);
        if (this.actor.arcadeBody2D.getTouches().bottom) {
          touchPlatforms = true;
          velocity.y = 0;
          break;
        }
      }
  
      // After the check, we have to reset the body to its normal size
      //this.actor.arcadeBody2D.setSize(this.initialSize.x, this.initialSize.y);
      //this.actor.arcadeBody2D.setOffset(this.initialOffset);
    }
    
    // We override the `.x` component based on the player's input
    if ( this.controls.held.left ) {
      velocity.x = -this.speed;
      // When going left, we flip the sprite
      this.actor.spriteRenderer.setHorizontalFlip(true);
    } else if ( this.controls.held.right ) {
      velocity.x = this.speed;
      // When going right, we clear the flip
      this.actor.spriteRenderer.setHorizontalFlip(false);
    } else velocity.x = 0;

    // If the player is on the ground and wants to jump,
    // we update the `.y` component accordingly
    //let touchBottom = this.actor.arcadeBody2D.getTouches().bottom;
    let touchBottom = touchSolids || touchPlatforms;
    if (touchBottom) {
      if ( this.controls.pressed.jump ) {
        velocity.y = this.jumpSpeed;
        this.actor.spriteRenderer.setAnimation("Jump");
      // If isKeyDown("DOWN") and touchPlatforms to drop down from platform
      } else if ( this.controls.pressed.down && touchPlatforms ) {
        velocity.y = -this.speed;
      } else {
        // Here, we should play either "Idle" or "Run" depending on the horizontal speed
        if (velocity.x === 0) this.actor.spriteRenderer.setAnimation("Idle");
        else this.actor.spriteRenderer.setAnimation("Move");
      }
    } else {
      // Here, we should play either "Jump" or "Fall" depending on the vertical speed
      if (velocity.y >= 0) { 
        this.actor.spriteRenderer.setAnimation("Jump");
      } else {
        this.actor.spriteRenderer.setAnimation("Fall");
        // If isKeyDown("DOWN") to add extra umph to the fall
        if ( this.controls.held.down ) {
          velocity.y = -Game.MAX_VELOCITY_Y;
          dampenFall = false;
        }
      } 
    }
    
    // Cap the velocity to avoid going crazy in falls
    velocity.x = Sup.Math.clamp(velocity.x, -Game.MAX_VELOCITY_X, Game.MAX_VELOCITY_X);
    if (dampenFall) velocity.y = Sup.Math.clamp(velocity.y, -Game.MAX_VELOCITY_Y/2, Game.MAX_VELOCITY_Y);
    
    // Finally, we apply the velocity back to the ArcadePhysics body
    this.actor.arcadeBody2D.setVelocity(velocity);
  }
}
Sup.registerBehavior(PlayerBehavior);
