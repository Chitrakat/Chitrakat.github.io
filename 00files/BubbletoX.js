let balls = [];
const numBalls = 0;
let ballSpeed = 4; // Speed of ball generation
let velocitySlider; // Slider to control ball velocity
let spawnTimer = 0; // Timer to track time for spawning balls
const spawnInterval = 2000; // Interval in milliseconds for spawning balls
let colorsArray = ['#2565F0', '#F04624', '#A9F024', '#F0E1BB', '#FF6B6B', '#4ECDC4', '#FFE66D', '#6A0572', '#FF9F1C', '#2EC4B6'];

function preload() {
  robotoMono = loadFont('RobotoMono-Bold.ttf'); // Load the font
}

function setup() {
  frameRate(60); 
  colorMode(HSB, 360, 100, 100, 100, 100); // Set color mode to HSB
  textFont(robotoMono); // Set the font for text
  createCanvas(1920, 1080);
  noStroke();
  velocitySlider = createSlider(0.1, 10, 1, 0.1); 
  velocitySlider.position(10, 10);
  background( '#000000'); // Set background to black

  for (let i = 0; i < numBalls; i++) {
    balls.push(new Ball(random(width), random(height)));
  }
}

function draw() {
  // background( '#F0E1BB'); // Set background to white
  fill(0, 0, 0, 0.1); // Semi-transparent black for fading effect
  rect(width/2, height/2, width, height); // Draw a rectangle over the entire canvas for fading effect

  let maxSpeed = velocitySlider.value(); // Get the velocity slider value
  
  // Draw the CenterX
  // let centerX = new CenterX(width / 2, height / 2, 1500, 50); // Create a new CenterX instance
  // centerX.show(); // Display the CenterX

  // Draw the "X" for visualization
  // stroke(255); // Set stroke color to white
  // strokeWeight(20); // Set stroke weight
  // line(0, 0, width, height); // Draw the first diagonal line
  // line(0, height, width, 0); // Draw the second diagonal line
  // noStroke(); // Disable stroke for other elements

  // Draw the small circle at the center
  // fill(255, 100); // Semi-transparent white
  // ellipse(width / 2, height / 2, 40); // Circle with a diameter of 40

  // Spawn balls every x seconds
  spawnTimer += deltaTime;
  if (spawnTimer >= spawnInterval) {
    spawnBalls();
    spawnTimer = 0; // Reset the timer
  }

  // Update and display balls
  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];
    ball.maxSpeed = maxSpeed; // Update ball's max speed

    // Check for collisions with other balls
    for (let j = i - 1; j >= 0; j--) {
      let other = balls[j];
      ball.checkCollision(other);
    }

    ball.flock(balls);
    ball.update();
    ball.show();

    // Remove balls that enter the small circle at the center
    if (dist(ball.pos.x, ball.pos.y, width / 2, height / 2) < 20 + ball.r) { // Include ball's radius
      balls.splice(i, 1);
    }
  }

}

function drawSQ(){
  fill(0, 30);
  square(mouseX, mouseY, random(0,width)); // Draw a square at the mouse position
}


function mouseDragged() {
  for (let i = 0; i < ballSpeed; i++) {
    balls.push(new Ball(mouseX, mouseY)); // Add multiple balls based on speed
  }
}

function spawnBalls() {
  // Spawn balls from random positions outside the canvas
  for (let i = 0; i < ballSpeed; i++) {
    let side = floor(random(4)); // Randomly pick a side: 0 = top, 1 = right, 2 = bottom, 3 = left
    let x, y;

    if (side === 0) { // Top
      x = random(width);
      y = -20; // Just above the canvas
    } else if (side === 1) { // Right
      x = width + 20; // Just outside the right edge
      y = random(height);
    } else if (side === 2) { // Bottom
      x = random(width);
      y = height + 20; // Just below the canvas
    } else if (side === 3) { // Left
      x = -20; // Just outside the left edge
      y = random(height);
    }

    balls.push(new Ball(x, y));
  }
}


class CenterX {
  constructor(x, y, size, collisionRadius, color = '#FFFFFF') {
    this.x = x;
    this.y = y;
    this.size = size; // Size of the X
    this.collisionRadius = collisionRadius; // Collision radius
  }

  update(size, collisionRadius) {
    this.size = size; // Update the size of the X
    this.collisionRadius = collisionRadius; // Update collision radius independently
  }

  show() {
    // Draw the X using two quads
    fill(255);
    noStroke();
    push();
    translate(this.x, this.y);
    rotate(PI / 4); // Rotate to form the first diagonal
    rectMode(CENTER);
    rect(0, 0, this.size, this.size / 5); // First diagonal
    rotate(HALF_PI); // Rotate to form the second diagonal
    rect(0, 0, this.size, this.size / 5); // Second diagonal
    pop();

    // Draw the collision circle for visualization
    // noFill();
    // stroke(255, 0, 0, 100); // Add a faint red outline for the collision circle
    // ellipse(this.x, this.y, this.collisionRadius * 2);
  }

}


class Ball {
  constructor(x, y, color = '#000000') {
    this.pos = createVector(x, y); // Position of the ball
    this.vel = p5.Vector.random2D(); // Random initial velocity
    this.acc = createVector(); // Acceleration starts at zero
    this.r = 20; // Initial radius of the ball
    this.maxSpeed = 10000; // Maximum speed the ball can move
    this.maxForce = 100; // Maximum steering force for the ball
    this.targetRadius = this.r; // Target radius for smooth size changes
    this.color = colorsArray[floor(random(colorsArray.length))]; // Color of the ball
    this.enteredLine = false; // Flag to check if the ball has entered the line area
    this.hasEnteredLine = false; // Flag to track if the ball has entered the line area
    this.letterStroke = false;
  }

  checkCollision(other) {
    let distance = p5.Vector.dist(this.pos, other.pos);
    let minDist = this.r + other.r;

    if (distance < minDist) {
      // Calculate the collision response
      let collisionNormal = p5.Vector.sub(this.pos, other.pos).normalize();
      let relativeVelocity = p5.Vector.sub(this.vel, other.vel);
      let speed = relativeVelocity.dot(collisionNormal);

      if (speed < 0) {
        // Reverse velocity along the collision normal
        let impulse = collisionNormal.mult(speed * -4);
        this.vel.add(impulse);
        other.vel.sub(impulse);
      }

      // // Separate overlapping balls
      let overlap = minDist - distance;
      let correction = collisionNormal.mult(overlap / 2);
      this.pos.add(correction);
      other.pos.sub(correction);
    }
  }

  flock(balls) {
    // Step 1: Move towards the closest point on the "X" lines
    let closestPoint1 = this.closestPointOnLine(createVector(0, 0), createVector(width, height));
    let closestPoint2 = this.closestPointOnLine(createVector(0, height), createVector(width, 0));
    let distanceToLine1 = p5.Vector.dist(this.pos, closestPoint1);
    let distanceToLine2 = p5.Vector.dist(this.pos, closestPoint2);

    let targetPoint = distanceToLine1 < distanceToLine2 ? closestPoint1 : closestPoint2;
    let forceToLine = this.seek(targetPoint);

    // Step 2: If close enough to the line, move towards the center
    if (p5.Vector.dist(this.pos, targetPoint) < 20) {
      let forceToCenter = this.seek(createVector(width / 2, height / 2));
      this.acc.add(forceToCenter);
      this.enteredLine = true; // Set flag to indicate the ball is close to the line
      this.hasEnteredLine = true; // Track that it has entered the line area
      // stroke(0,0,100)
    } else {
      this.acc.add(forceToLine);
      this.enteredLine = false; // Reset flag if not close to the line
    }
  }

  closestPointOnLine(lineStart, lineEnd) {
    // Calculate the closest point on a line segment to this ball's position
    let lineDir = p5.Vector.sub(lineEnd, lineStart);
    let t = p5.Vector.sub(this.pos, lineStart).dot(lineDir) / lineDir.magSq();
    t = constrain(t, 0, 1); // Constrain t to the segment
    return p5.Vector.add(lineStart, lineDir.mult(t));
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.pos); // Vector pointing to the target
    desired.setMag(this.maxSpeed); // Set the desired speed
    let steer = p5.Vector.sub(desired, this.vel); // Calculate steering force
    steer.limit(this.maxForce); // Limit the steering force
    return steer; // Return the steering force
  }

  update() {
    
    // Smoothly transition the radius towards the target radius
    this.r = lerp(this.r, this.targetRadius, 0.1);

    // Update velocity and position
    this.vel.add(this.acc); // Update velocity based on acceleration
    this.vel.limit(this.maxSpeed); // Limit the velocity to the maximum speed
    this.pos.add(this.vel); // Update position based on velocity
    this.acc.mult(0); // Reset acceleration for the next frame
  }

  show() {
    fill('ffffff'); // Set fill color to black
    // noStroke(); // Remove stroke

    if (!this.hasEnteredLine) {
      stroke(0, 0, 100, 50); // Set stroke color to a semi-transparent white for the outline
      strokeWeight(random(10)); // Set stroke weight for the outline
    }
    else {
      stroke(0, 3); // Set stroke color to black for the outline
      strokeWeight(3); // Set stroke weight for the outline
    }
    // this.r = lerp(this.r, this.targetRadius, 0.1); // Smoothly transition the radius

    // stroke(random(2) < 1 ? 0 : 255); // Randomly sets stroke to black or white

    let distanceToCenter = dist(this.pos.x, this.pos.y, width / 2, height / 2); // Distance to the center of the X
    this.targetRadius = map(distanceToCenter, 0, width / 2, 20, 1); // Smoothly adjust target radius based on distance


    let bounceSize = 30;
    if (distanceToCenter<200){
      this.letterStroke = true; // Set flag to indicate the ball is close to the center
    }
    else{
      bounceSize = sin(frameCount * 0.01)*20 + this.r*1 ; // Calculate bouncing text size
    }

    rectMode(CENTER); // Set rect mode to center
    fill(0); // Set fill color to the ball's color
    square(this.pos.x, this.pos.y, this.r); // Draw the ball as a square

    // Adding words on the ball 
    noStroke();
    let alphaWave = ((sin(frameCount * 0.1)* + 20));
    // alphaWave = alphaWave.toString();
    console.log(Math.abs(alphaWave));
    fill(this.color); // Set fill with alpha 
 
    if (this.letterStroke) {
      // stroke(0);
      // strokeWeight(20); // Set stroke weight for the text outline
      // strokeCap(ROUND); // Set stroke cap to round for smoother edges
      // fill(this.color ); // Set fill of text without alpha 
    }

    textAlign(CENTER, CENTER + 15); // Center the text
    // textSize((this.r / 3)); // Set text size proportional to the ball's radius
    textSize(bounceSize); // Set text size with bouncing effect
    text("SUBMIT\n2", this.pos.x, this.pos.y); // Draw the text at the ball's position
  }
}