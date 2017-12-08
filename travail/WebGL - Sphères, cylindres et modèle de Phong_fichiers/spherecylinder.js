// This program was developped by Daniel Audet and uses sections of code  
// from http://math.hws.edu/eck/cs424/notes2013/19_GLSL.html
//
//  It has been adapted to be compatible with the "MV.js" library developped
//  for the book "Interactive Computer Graphics" by Edward Angel and Dave Shreiner.
//

"use strict";
var gl;   // The webgl context.
var canvas;
var rect;

var ScaleLoc;
var alphaLoc;

//textures normales
var CoordsLoc;       // Location of the coords attribute variable in the standard texture mappping shader program.
var NormalLoc;
var TexCoordLoc;

var ProjectionLoc;     // Location of the uniform variables in the standard texture mappping shader program.
var ModelviewLoc;
var NormalMatrixLoc;
var uTexture;

//Texture : aucune (émissif)
var ProjectionLocE;     // Location of the uniform variables in the standard texture mappping shader program.
var ModelviewLocE;
var CoordsLocE;

//textureMap
var aCoordsmap;      // Location of the attribute variables in the environment mapping shader program.
var aNormalmap;
var aTexCoordmap;

var uProjectionmap;     // Location of the uniform variables in the environment mapping shader program.
var uModelviewmap;
var uNormalMatrixmap;
var uMinvmap;
var Minv = mat3();  // matrix inverse of modelview

//textureBox
var aCoordsbox;     // Location of the coords attribute variable in the shader program used for texturing the environment box.
var aNormalbox;
var aTexCoordbox;

var uModelviewbox;
var uProjectionbox;
var uEnvbox;
//fin texture Box

var ct = 0;
var img = new Array(6);
var img2 = new Array(6);

var texIDmap0,texIDmap1;  // environmental texture identifier
var texID1, texID2, texID3, texID4 , texID5, texID6, texID7, texID8, texID9, texID10;  // standard texture identifiers

var prog, progmap,progbox, progE;// shader program identifiers
 
var ntextures_tobeloaded=0;
var ntextures_loaded=0;
 //fin texture

var projection;   //--- projection matrix
var translation = translate(0,0,-50);//position initiale de la caméra
var rotation = rotate(0,1,0,0);
var modelview = mat4();    // modelview matrix
var localModelview;
var flattenedmodelview;    //--- flattened modelview matrix

var normalMatrix = mat3();  //--- create a 3X3 matrix that will affect normals

//var rotator;   // A SimpleRotator object to enable rotation by mouse dragging.
var zTranslate = 0;
var xTranslate = 0;
var x=0;
var y=0;
var prevx, prevy;
var dragging = false;
var anglex = 0;
var angley = 0;

var sphere, cylinder, box , perfectTetra;  // model identifiers
var hemisphereinside, hemisphereoutside, thindisk;
var tetra, modifiedCylinder, hemisphereE, cylinderE, vitreMap, cubeMap , envbox;

var lightPosition = vec4(20, 20, 100, 1.0); // en accord avec le soleil

var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient;
var materialDiffuse;
var materialSpecular;
var materialShininess;

//id
var baseID = 0;
var rightWingID = 1;
var leftWingID = 2;
var leftBottomPlateID = 3 ;
var leftTopPlateID = 4 ;
var rightTopPlateID = 5 ;
var rightBottomPlateID = 6 ;

var sunID=7;
var venusID = 8;
var earthID = 9;
var marsID = 10;
var moonID = 11;

var numNodes = 12;

var xScale;

var varyingTheta = 0;
var theta = [20,50];//0 pour les ailes et 1 pour les plaques
var stack = [];
var figure = [];
for( var i=0; i<numNodes; i++) figure[i] = createNode(null, null, null, null);

var ambientProduct, diffuseProduct, specularProduct;
//Système de texture
function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture); //pourquoi la lier dès le départ?
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to insure the model is displayed)

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleLoadedTextureMap(texture, tableauImage) {

    ct++;
    if (ct == 6) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var targets = [
           gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
           gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tableauImage[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        ct=0;
    }
	ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to insure the model is displayed)
}

function initTexture(){
    var urls = [
   	"nebula/nebula_posx.png", "nebula/nebula_negx.png",
   	"nebula/nebula_posy.png", "nebula/nebula_negy.png",
   	"nebula/nebula_posz.png", "nebula/nebula_negz.png"
	];

	var urls2 = [
   	"ciel-nuages/posx.jpg", "ciel-nuages/negx.jpg",
   	"ciel-nuages/posy.jpg", "ciel-nuages/negy.jpg",
   	"ciel-nuages/posz.jpg", "ciel-nuages/negz.jpg"
	];
	

    texIDmap0 = gl.createTexture();

    for (var i = 0; i < 6; i++) {
       img[i] = new Image();
       img[i].onload = function () {  // this function is called when the image download is complete

           handleLoadedTextureMap(texIDmap0, img);
       }
       img[i].src = urls[i];   // this line starts the image downloading thread
		ntextures_tobeloaded++;
    }

    texIDmap1 = gl.createTexture();
    for (var i = 0; i < 6; i++) {
        img2[i] = new Image();
        img2[i].onload = function () {  // this function is called when the image download is complete
        	
            handleLoadedTextureMap(texIDmap1, img2);
        }
        img2[i].src = urls2[i];   // this line starts the image downloading thread
		ntextures_tobeloaded++;
    }

   	texID1 = gl.createTexture();
	
   	texID1.image = new Image();
   	texID1.image.onload = function () {
   	   handleLoadedTexture(texID1)
   	}
   	texID1.image.src = "dirtyMetal.jpg";
   	ntextures_tobeloaded++;
	
   	texID2 = gl.createTexture();
	
   	texID2.image = new Image();
   	texID2.image.onload = function () {
   	   handleLoadedTexture(texID2)
   	}
   	texID2.image.src = "whitePlastic.jpg";
   	ntextures_tobeloaded++;

        texID3 = gl.createTexture();
    
    texID3.image = new Image();
    texID3.image.onload = function () {
       handleLoadedTexture(texID3)
    }
    texID3.image.src = "greyPlastic.jpg";
    ntextures_tobeloaded++;

    texID4 = gl.createTexture();
    
    texID4.image = new Image();
    texID4.image.onload = function () {
       handleLoadedTexture(texID4)
    }
    texID4.image.src = "spaceship.jpg";
    ntextures_tobeloaded++;

    texID5 = gl.createTexture();
    
    texID5.image = new Image();
    texID5.image.onload = function () {
       handleLoadedTexture(texID5)
    }
    texID5.image.src = "astres/sun.jpg";
    ntextures_tobeloaded++;

    texID6 = gl.createTexture();
    
    texID6.image = new Image();
    texID6.image.onload = function () {
       handleLoadedTexture(texID6)
    }
    texID6.image.src = "astres/venus.jpg";
    ntextures_tobeloaded++;

    texID7 = gl.createTexture();
    
    texID7.image = new Image();
    texID7.image.onload = function () {
       handleLoadedTexture(texID7)
    }
    texID7.image.src = "astres/earth.jpg";
    ntextures_tobeloaded++;

    texID8 = gl.createTexture();
    
    texID8.image = new Image();
    texID8.image.onload = function () {
       handleLoadedTexture(texID8)
    }
    texID8.image.src = "astres/mars.jpg";
    ntextures_tobeloaded++;

    texID9 = gl.createTexture();
    
    texID9.image = new Image();
    texID9.image.onload = function () {
       handleLoadedTexture(texID9)
    }
    texID9.image.src = "astres/lune.jpg";
    ntextures_tobeloaded++;

    texID10 = gl.createTexture();
    
    texID10.image = new Image();
    texID10.image.onload = function () {
       handleLoadedTexture(texID10)
    }
    texID10.image.src = "signature.png";
    ntextures_tobeloaded++;
}
//Système de noeuds
function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function initNodes(Id) {

    var m = mat4();
    
    switch(Id) {
    case baseID:
    m = rotate(0, 0, 0, 1);
    figure[baseID] = createNode( m, base, null, rightWingID);
    break;
    
    case rightWingID:
	m = translate(2.5,-0.5,0);
	m = mult(m, rotate(-theta[0], 0, 0, 1 ));
    figure[rightWingID] = createNode( m, wing1, leftWingID, leftTopPlateID);
    break;

    case leftWingID:
    m = translate(-2.5,-0.5,0);
	m = mult(m, rotate(theta[0], 0, 0, 1 ));
    figure[leftWingID] = createNode( m, wing2 , null, rightTopPlateID);
    break;

    case leftTopPlateID:
	m = translate(10.5, 0, 4);
	m = mult(m, rotate(theta[1], 0, 0, 1 ));
    figure[leftTopPlateID] = createNode( m, plate, leftBottomPlateID, null );
    break;

    case leftBottomPlateID:
	m = translate(10.5, 0, 4);
	m = mult(m, rotate(-theta[1], 0, 0, 1 ));
    figure[leftBottomPlateID] = createNode( m, plate, null, null );
    break;

    case rightTopPlateID:
	m = translate(-10.5, 0, 4);
	m = mult(m, rotate(theta[1], 0, 0, 1 ));
    figure[rightTopPlateID] = createNode( m, plate, rightBottomPlateID, null );
    break;

    case rightBottomPlateID:
	m = translate(-10.5, 0, 4);
	m = mult(m, rotate(-theta[1], 0, 0, 1 ));
    figure[rightBottomPlateID] = createNode( m, plate, null, null );
    break;

    case sunID:
    m = translate(28, 28, 140);
    figure[sunID]=createNode( m, sun, null, venusID );
    break;

    case venusID:
    m = translate(40, 0, 0);
    m = mult(m,rotate(varyingTheta, 0, 1, 0 ) );
    figure[venusID]=createNode( m, venus, earthID, null );
    break;

    case earthID:
    m = rotate(130, 0, 1, 0 );
    m = mult(m,translate(80, 0, 0) );
    m = mult(m,rotate(varyingTheta, 0, 1, 0 ) );
    figure[earthID]=createNode( m, earth, marsID, moonID );
    break;

    case marsID:
    m = rotate(90, 0, 1, 0 );
    m = mult(m,translate(120, 0, 0) );
    m = mult(m,rotate(varyingTheta, 0, 1, 0 ) );
    figure[marsID]=createNode( m, mars, null, null );
    break;

    case moonID:
    m = rotate(varyingTheta, 0, 1, 0 );
    m = mult(m,translate(0, 0, 20) );
    m = mult(m,rotate(-varyingTheta, 0, 1, 0 ) );
    
    figure[moonID]=createNode( m, moon, null, null );
    break;
    }
}

function traverse(Id) {
   
   if(Id == null) return; 
   stack.push(modelview);
   modelview = mult(modelview, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child); 
    modelview = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling); 
}

function unflatten(matrix) {
    var result = mat4();
    result[0][0] = matrix[0]; result[1][0] = matrix[1]; result[2][0] = matrix[2]; result[3][0] = matrix[3];
    result[0][1] = matrix[4]; result[1][1] = matrix[5]; result[2][1] = matrix[6]; result[3][1] = matrix[7];
    result[0][2] = matrix[8]; result[1][2] = matrix[9]; result[2][2] = matrix[10]; result[3][2] = matrix[11];
    result[0][3] = matrix[12]; result[1][3] = matrix[13]; result[2][3] = matrix[14]; result[3][3] = matrix[15];

    return result;
}

function extractNormalMatrix(matrix) { // This function computes the transpose of the inverse of 
    // the upperleft part (3X3) of the modelview matrix (see http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ )

    var result = mat3();
    var upperleft = mat3();
    var tmp = mat3();

    upperleft[0][0] = matrix[0][0];  // if no scaling is performed, one can simply use the upper left
    upperleft[1][0] = matrix[1][0];  // part (3X3) of the modelview matrix
    upperleft[2][0] = matrix[2][0];

    upperleft[0][1] = matrix[0][1];
    upperleft[1][1] = matrix[1][1];
    upperleft[2][1] = matrix[2][1];

    upperleft[0][2] = matrix[0][2];
    upperleft[1][2] = matrix[1][2];
    upperleft[2][2] = matrix[2][2];

    tmp = matrixinvert(upperleft);
    result = transpose(tmp);

    return result;
}

function matrixinvert(matrix) {

    var result = mat3();

    var det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) -
                 matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
                 matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    var invdet = 1 / det;

    // inverse of matrix m
    result[0][0] = (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) * invdet;
    result[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invdet;
    result[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invdet;
    result[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invdet;
    result[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invdet;
    result[1][2] = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) * invdet;
    result[2][0] = (matrix[1][0] * matrix[2][1] - matrix[2][0] * matrix[1][1]) * invdet;
    result[2][1] = (matrix[2][0] * matrix[0][1] - matrix[0][0] * matrix[2][1]) * invdet;
    result[2][2] = (matrix[0][0] * matrix[1][1] - matrix[1][0] * matrix[0][1]) * invdet;

    return result;
}


function createModel(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.textureBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);

    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(CoordsLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(NormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(TexCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(ModelviewLoc, false, flatten(localModelview));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(NormalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        console.log(this.count);
    }
    return model;
}

function createModelmap(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);

    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoordsmap, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(aNormalmap, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(uModelviewmap, false, flatten(localModelview));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(uNormalMatrixmap, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.uniformMatrix3fv(uMinvmap, false, flatten(Minv));  // send matrix inverse of modelview in order to rotate the skybox

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        console.log(this.count);
    }
    return model;
}

function createEmissiveModel(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);

    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(CoordsLocE, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(ModelviewLocE, false, flatten(localModelview));    //--- load flattened modelview matrix
      
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        console.log(this.count);
    }
    return model;
}

//note : je fait par rapport au modelview initial donc
function createModelbox(modelData) {  // For creating the environment box.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoordsbox, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelviewbox, false, flatten(modelview));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}

function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}

//Calculs de matrices et appels de render
function allInOneTetra(tetra, xt, yt, zt, r, xr, yr, zr, xs, ys, zs){
    gl.uniform3fv(ScaleLoc, flatten(vec3(xs,ys,zs)));

    localModelview = modelview;
    localModelview = mult(localModelview, translate(xt, yt, zt));
    localModelview = mult(localModelview, rotate(r, xr, yr, zr));
    normalMatrix = extractNormalMatrix(localModelview);  // always extract the normal matrix before scaling
    localModelview = mult(localModelview, scale(xs, ys, zs));
    tetra.render();
}

function allInOne(model, xt, yt, zt, r, xr, yr, zr, xs, ys, zs){
    gl.uniform3fv(ScaleLoc, flatten(vec3(0,0,0)));

    localModelview = modelview;
    localModelview = mult(localModelview, translate(xt, yt, zt));
    localModelview = mult(localModelview, rotate(r, xr, yr, zr));
    normalMatrix = extractNormalMatrix(localModelview);  // always extract the normal matrix before scaling
    localModelview = mult(localModelview, scale( xs, ys, zs));
    model.render();
}

//couleurs et appels de "AllInOnes"
function base(){
    //texture map
    //  Draw first model using environmental mapping shader
    gl.useProgram(progmap);
    gl.enableVertexAttribArray(aCoordsmap);
    gl.enableVertexAttribArray(aNormalmap);
    gl.disableVertexAttribArray(aTexCoordmap);  // texture coordinates not used (environmental mapping) //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);
    //gl.uniform1i(uSkybox, 0);
    allInOne(vitreMap,  0.0, 3.75, 2.5,    105, 1, 0, 0, 0.25, 0.5, 0.1);
	
    gl.useProgram(prog);
	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.33, 0.35, 0.395, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
	materialShininess = 300.0;

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

    var initialmodelview = modelview;
	
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID3);
    gl.uniform1i(uTexture, 1);


    //					translate		rotation	scale
    allInOne(cylinder,	0.0, 0, 0.0,	0, 1, 0, 0,	0.2, 0.2, 0.75);
    //  motif avant intérieur
    allInOne(cylinder,	0.0, 0, 0.0,	0, 1, 0, 0,	0.1, 0.1, 0.80);

    //  cockpit
	allInOne(sphere,	0.0, 0, 0.0,	0, 1, 0, 0,	0.5, 0.5, 0.8);

    //  demi-sphère arrière
    allInOne(hemisphereoutside,	0.0, 0, -3.0,	0, 1, 0, 0,	0.48, 0.48, 0.5);
	allInOne(thindisk,	0.0, 0, -3.0,	0, 1, 0, 0,	0.48, 0.48, 0.5);

	symBase(1);
	symBase(-1);
}

//éléments de la partie centrale de la base qui ont une symétrie
function symBase(s){
	//cockpit partie symétrique
    gl.useProgram(progmap);
    gl.disableVertexAttribArray(aTexCoordmap);  // texture coordinates not used (environmental mapping) //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);
    //gl.uniform1i(uSkybox, 0);

    gl.uniform3fv(ScaleLoc, flatten(vec3(0,0,0)));

    localModelview = modelview;
    localModelview = mult(localModelview, translate(s*3, 2.2, 3.5));
    localModelview = mult(localModelview, rotate(115, 1, 0, 0));
    localModelview = mult(localModelview, rotate(s*-45, 0, 1, 0));
    localModelview = mult(localModelview, rotate(s*20, 0, 0, 1));
    normalMatrix = extractNormalMatrix(localModelview);  // always extract the normal matrix before scaling
    localModelview = mult(localModelview, scale( 0.12, 0.3, 0.1));
    vitreMap.render();

    gl.useProgram(prog);
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE1);

	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.33, 0.35, 0.395, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
	

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));

	//  côté base
    allInOne(box,	s*3.8, 2.5, -1.0,	s*-55, 0, 0, 1,	0.25, 0.1, 0.5);

    //  réacteur 
    //intérieur
    allInOne(modifiedCylinder,	s*2, -1.8, -7.1,	0, 1, 0, 0,	0.09, 0.09, 0.15);


    
    //extérieur
    allInOne(cylinder,	s*2, -1.8, -7,	0, 1, 0, 0,	0.1, 0.1, 0.1);


    gl.useProgram(progE);
    gl.uniform4fv(gl.getUniformLocation(progE, "vColor"), flatten(vec4(1,0,0,1)));  // send projection matrix to the shader program
    allInOne(hemisphereE,	s*2, -1.8, -8.5,	180, 0, 1, 0,	0.08, 0.08, 0.05);
    gl.useProgram(prog);
}

function wing1(){
	xScale=1;
	wing(1);
}

function wing2(){
	xScale=-1;
	wing(-1);
}

function wing(){

    gl.bindTexture(gl.TEXTURE_2D, texID4);
    // Send texture 1 to sampler
    gl.uniform1i(uTexture, 1);

    normalMatrix = extractNormalMatrix(modelview);


    materialAmbient = vec4(0.33, 0.35, 0.395, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
	

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));

	tetra=createModel(PersonalizedTetrahedron([0,0,0],[0,10,0],[10,0,0],[0,0,10]));
    //bord aile triangulaire avant
    allInOneTetra(tetra, 	xScale*5, 0, 5.5,	xScale*-30, 0, 1, 0,	xScale*0.4, 0.05, 0.715);

    //bord aile triangulaire arrière
    allInOneTetra(tetra, 	xScale*5.3, 0, 2.4,	xScale*120, 0, 1, 0,	xScale*0.8, 0.05, 0.4);

    //  barre avant
    allInOne(box,	xScale*7.5, -0.3, 8,	xScale*-60, 0, 1, 0,	0.05, 0.05, 0.6);


    //  barre arrière
    allInOne(box,	xScale*7.5, -0.3, -0.3,	xScale*55, 0, 1, 0,	0.05, 0.05, 0.6);

    //  support plaques
    allInOne(box,	xScale*5.5, 0.0, 4.0,	0, 1, 0, 0,	1, 0.05, 0.35);

    //  support triangle avant
    allInOne(box,	xScale*2, 0.0, 7.5,	0, 1, 0, 0,	0.3, 0.1, 1.3);

    //  principale accroche aile
    allInOne(box,	xScale*3.5, -0.01, 3.3,	0, 1, 0, 0,	0.35, 0.1, 1.4);


    //canons
	 gl.bindTexture(gl.TEXTURE_2D, texID1);
    // Send texture 1 to sampler
    gl.uniform1i(uTexture, 1);

    materialAmbient = vec4(0.20, 0.28, 0.28, 1.0);
	materialDiffuse = vec4(0.2, 0.2, 0.2, 1.0);
	materialSpecular = vec4(0.5, 0.5, 0.5, 1.0);
	materialShininess = 20.0;
	

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
	gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);
	//canons

    //  avant interieur
    allInOne(modifiedCylinder,	xScale*0.0, 0, 12,	180, 1, 0, 0,		0.025, 0.025, 0.74);

    //  avant 3
    allInOne(cylinder,	0, 0, 17.5,	0, 1, 0, 0,		0.05, 0.05, 0.15);

    //  avant 2
    allInOne(cylinder,	0, 0, 14,	0, 1, 0, 0,		0.05, 0.05, 0.15);

    //  avant 1
    allInOne(cylinder,	0, 0, 8,	0, 1, 0, 0,		0.05, 0.05, 0.3);

    //  côté interieur
    allInOne(cylinder,	xScale*4.7, 0, 10.5,	0, 1, 0, 0,		0.0125, 0.0125, 0.1);

    //  côté extérieur
    allInOne(cylinder,	xScale*4.7, 0, 10.5,	0, 1, 0, 0,		0.025, 0.025, 0.04);

    //  côté extérieur
    allInOne(modifiedCylinder,	xScale*4.7, 0, 11.7,	180, 1, 0, 0,		0.025, 0.025, 0.04);

    gl.useProgram(progE);
    gl.uniform4fv(gl.getUniformLocation(progE, "vColor"), flatten(vec4(1,0,1,1)));  // send projection matrix to the shader program
    allInOne(cylinderE,  xScale*0.0, 0, 25,  0, 1, 0, 0,     0.01, 0.01, 0.3);
    allInOne(cylinderE,  xScale*4.7, 0, 17,  0, 1, 0, 0,     0.005, 0.005, 0.2);
    gl.uniform4fv(gl.getUniformLocation(progE, "vColor"), flatten(vec4(0,0,1,1)));
    allInOne(cylinderE,  xScale*0.0, 0, 25,  0, 1, 0, 0,     0.01, 0.01, 0.3);
    allInOne(hemisphereE,   xScale*0.0, 0, 19.3,    0, 0, 1, 0,   0.02, 0.02, 0.01);
    allInOne(hemisphereE,   xScale*4.7, 0, 12.0,    0, 0, 1, 0,   0.015, 0.015, 0.01);
    gl.useProgram(prog);
    
    //triangles intérieurs
    gl.bindTexture(gl.TEXTURE_2D, texID2);
    // Send texture 1 to sampler
    gl.uniform1i(uTexture, 1);

    materialAmbient = vec4(0.4, 0.25, 0.0, 1.0);
	materialDiffuse = vec4(0.3, 0.3, 0.3, 1.0);
	materialSpecular = vec4(0.2, 0.2, 0.2, 1.0);
	
	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));

    //triangle bord base avant
    
	allInOneTetra(tetra, 	xScale*1.5,0.50,3.0,	xScale*-8,0,1,0,	xScale*0.2, 0.2, 0.75);

    //triangle bord base arrière														//translate		//rotate		  	//scale
	allInOneTetra(tetra, 	xScale*1.8,0.50,-3.5,	xScale*12,0,1,0,	xScale*0.2,0.2,0.715);
   
    //Ailes
    //triangle avant
    allInOneTetra(tetra, 	xScale*0.4, 0.3, 13.0,	xScale*0.0, 0, 1, 0,	xScale*0.4, 0.2, 0.65);
}

function plate(){
	materialAmbient = vec4(0.6, 0.45, 0.2, 1.0);
	ambientProduct = mult(lightAmbient, materialAmbient);
	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));

	//hérite de la couleur doré de la dernière partie de wing
	normalMatrix = extractNormalMatrix(modelview);

    allInOne(box,	xScale*3.5, 0, 0.0,	0, 1, 0, 0,	0.7, 0.05, 0.3);

    //  now, draw box model
    allInOne(box,	xScale*3, 0, 0.0,	0, 1, 0, 0,	0.6, 0.025, 0.6);
}

function skybox(){
	//Draw the environment (box)
       gl.useProgram(progbox); // Select the shader program that is used for the environment box.
       gl.uniformMatrix4fv(uProjectionbox, false, flatten(projection));

       gl.enableVertexAttribArray(aCoordsbox);
       gl.disableVertexAttribArray(aNormalbox);     // normals are not used for the box
       gl.disableVertexAttribArray(aTexCoordbox);  // texture coordinates not used for the box

       gl.activeTexture(gl.TEXTURE0);
       gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);
       // Send texture to sampler
       gl.uniform1i(uEnvbox, 0);

       envbox.render();
}

function sun(){
	gl.useProgram(prog);
	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.7, 0.4, 0.1, 1.0);
	materialDiffuse = vec4(0.6, 0.7, 0.8, 1.0);
	materialSpecular = vec4(1, 1, 1, 1.0);
	materialShininess = 10.0;

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

    var initialmodelview = modelview;
	
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID5);
    gl.uniform1i(uTexture, 1);
    //  cockpit
	allInOne(sphere,	0.0, 0, 0.0,	0, 1, 0, 0,	2, 2, 2);
}

function venus(){
	gl.useProgram(prog);
	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.33, 0.35, 0.395, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
	materialShininess = 300.0;

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

    var initialmodelview = modelview;
	
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    //gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID6);
    gl.uniform1i(uTexture, 1);
    //  cockpit
	allInOne(sphere,	0.0, 0, 0.0,	0, 1, 0, 0,	1, 1, 1);
}

function earth(){
	gl.useProgram(prog);
	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.30, 0.30, 0.4, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
	materialShininess = 300.0;

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

    var initialmodelview = modelview;
	
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID7);
    gl.uniform1i(uTexture, 1);
    //  cockpit
	allInOne(sphere,	0.0, 0, 0.0,	0, 1, 0, 0,	1, 1, 1);
}

function mars(){
	gl.useProgram(prog);
	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.5, 0.4, 0.2, 1.0);
	materialDiffuse = vec4(0.6, 0.7, 0.8, 1.0);
	materialSpecular = vec4(1, 1, 1, 1.0);
	materialShininess = 300.0;

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

    var initialmodelview = modelview;
	
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    //gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID8);
    gl.uniform1i(uTexture, 1);
    //  cockpit
	allInOne(sphere,	0.0, 0, 0.0,	0, 1, 0, 0,	1, 1, 1);
}

function moon(){
	gl.useProgram(prog);
	normalMatrix = extractNormalMatrix(modelview);

	materialAmbient = vec4(0.33, 0.35, 0.395, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0.1, 0.1, 0.1, 1.0);
	materialShininess = 300.0;

	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

    var initialmodelview = modelview;
	
    gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    //gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texID9);
    gl.uniform1i(uTexture, 1);
    //  cockpit
	allInOne(sphere,	0.0, 0, 0.0,	0, 1, 0, 0,	0.5, 0.5, 0.5);
}

function cubes (){
	//  Draw first model using environmental mapping shader
    gl.useProgram(progmap);
    gl.enableVertexAttribArray(aCoordsmap);
    gl.enableVertexAttribArray(aNormalmap);
    gl.disableVertexAttribArray(aTexCoordmap);  // texture coordinates not used (environmental mapping) //les coordonnées et les normales sont activées dans init
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap1);
    //gl.uniform1i(uSkybox, 0);
    allInOne(cubeMap,  10, -30, 0,    varyingTheta, 0, 1, 0, 1, 1, 1);


    // Dessiner le cube translucide
		gl.useProgram(prog);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.BLEND);
		gl.depthMask(false);  // Le tampon sera en lecture seulement.
		//                       // Les objets translucides seront cachés
		// 					  // s'ils sont derrière des objets opaques 
		// 					  //  mais ils seront visibles s'ils sont devant.
		
		gl.uniform1f(alphaLoc, 0.5);
	
        gl.enableVertexAttribArray(TexCoordLoc); //les coordonnées et les normales sont activées dans init
    	gl.activeTexture(gl.TEXTURE1);
    	gl.bindTexture(gl.TEXTURE_2D, texID10);
    	gl.uniform1i(uTexture, 1);
        allInOne(box,  -10, -30, 0,    varyingTheta, 0, 1, 0, 1, 1, 1);

        gl.uniform1f(alphaLoc, 1);
		gl.disable(gl.BLEND);
		gl.depthMask(true);  // ne pas oublier car on ne pourra pas effacer 
		                     // le tampon de profondeur lors de la prochaine itération
}

function render(){
	gl.clearColor(0.1, 0.1, 0.1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //gl.enableVertexAttribArray(TexCoordLoc); //because we need it

	//flattenedmodelview = rotator.getViewMatrix();
    //modelview = unflatten(flattenedmodelview);
    //attention si j'utilise plus le rotator !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //gl.uniformMatrix4fv(gl.getUniformLocation(prog, "initialModelview"), false, modelview);  // send projection matrix to the shader program
	// Compute the inverse of the modelview matrix
    modelview = mult(rotation,translation );
	Minv = matrixinvert(modelview);
	gl.useProgram(prog);
	gl.uniformMatrix4fv(gl.getUniformLocation(prog, "initialModelview"), false, flatten(modelview));  // send projection matrix to the shader program

	skybox();
	//note, il faudra modifier modelview après la skybox et avant la suite car seul la skybox ne bouge pas
	


	traverse(baseID);
	traverse(sunID);
	cubes();
}

function turnMoonAndRender(){
	varyingTheta += 0.5;
	initNodes(moonID);
	initNodes(venusID);
	initNodes(earthID);
	initNodes(marsID);
	render();
}

//An event listener for the keydown event.  It is installed by the init() function.
function doKey(evt) {
    var rotationChanged = true;
    switch (evt.keyCode) {
        case 37: translation = mult(translation, translate(Math.cos(angley*Math.PI/180),0 , Math.sin(angley*Math.PI/180)) ); break;        // left arrow
        case 39: translation = mult(translation, translate(-Math.cos(angley*Math.PI/180),0 , -Math.sin(angley*Math.PI/180))); break;        // right arrow
        case 38: translation = mult(translation, translate(Math.sin(-angley*Math.PI/180)*Math.cos(anglex*Math.PI/180),Math.sin(anglex*Math.PI/180), Math.cos(angley*Math.PI/180)*Math.cos(anglex*Math.PI/180))); break;        // up arrow
        case 40: translation = mult(translation, translate(Math.sin(angley*Math.PI/180)*Math.cos(anglex*Math.PI/180), -Math.sin(anglex*Math.PI/180), -Math.cos(angley*Math.PI/180)*Math.cos(anglex*Math.PI/180))); break;        // down arrow
        case 13: //zTranslate = xTranslate = 0; break;  // return
        case 36: //zTranslate = xTranslate = 0; break;  // home
        default: rotationChanged = false;
    }
    if (rotationChanged) {
        evt.preventDefault();
        render();
    }
}

function doMouseDown(evt) {
    if (dragging)
        return;
    dragging = true;
    document.addEventListener("mousemove", doMouseDrag, false);
    document.addEventListener("mouseup", doMouseUp, false);
    prevx = evt.clientX - rect.left;
    prevy = evt.clientY - rect.top;
}

function doMouseDrag(evt) {
    if (!dragging)
        return;
    var x = evt.clientX - rect.left;
    var y = evt.clientY - rect.top;

     anglex += y - prevy;
    if (Math.cos(anglex*Math.PI/180)<0){
    	angley += -x + prevx;
    }
    else{
    	angley += x - prevx;
    }

     prevx = x;
     prevy = y;
    rotation = rotate(anglex,1,0,0);
	rotation = mult(rotation,rotate(angley,0,1,0));
    render();  
}

function doMouseUp(evt) {
    if (dragging) {
        document.removeEventListener("mousemove", doMouseDrag, false);
        document.removeEventListener("mouseup", doMouseUp, false);
        dragging = false;
    }
}

window.onload = function init() {
    try {
        canvas = document.getElementById('glcanvas');
        rect = canvas.getBoundingClientRect();
        gl = canvas.getContext("webgl");
        if (!gl) {
            gl = canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            throw "Could not create WebGL context.";
        }

        canvas.addEventListener("mousedown", doMouseDown, false);

        projection = perspective(70.0, 1.0, 1.0, 2000.0);

        // LOAD FIRST SHADER  (environmental mapping)
        var vertexShaderSourcemap = getTextContent("vshadermap");
        var fragmentShaderSourcemap = getTextContent("fshadermap");
        progmap = createProgram(gl, vertexShaderSourcemap, fragmentShaderSourcemap);

        gl.useProgram(progmap);

        // locate variables for further use
        aCoordsmap = gl.getAttribLocation(progmap, "vcoords");
        aNormalmap = gl.getAttribLocation(progmap, "vnormal");
        aTexCoordmap = gl.getAttribLocation(progmap, "vtexcoord");

        uModelviewmap = gl.getUniformLocation(progmap, "modelview");
        uProjectionmap = gl.getUniformLocation(progmap, "projection");
        uNormalMatrixmap = gl.getUniformLocation(progmap, "normalMatrix");
        uMinvmap = gl.getUniformLocation(progmap, "minv");

        //uSkybox = gl.getUniformLocation(progmap, "skybox");

        gl.uniformMatrix4fv(uProjectionmap, false, flatten(projection)); // send projection matrix to the new shader program

        gl.enableVertexAttribArray(aCoordsmap);
        gl.enableVertexAttribArray(aNormalmap);
        gl.disableVertexAttribArray(aTexCoordmap);   // texture coordinates not used (environmental mapping)

        // LOAD SECOND SHADER (standard texture mapping)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");

        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(prog);

        // locate variables for further use
        CoordsLoc = gl.getAttribLocation(prog, "vcoords");
        NormalLoc = gl.getAttribLocation(prog, "vnormal");
        TexCoordLoc = gl.getAttribLocation(prog, "vtexcoord");

        ModelviewLoc = gl.getUniformLocation(prog, "modelview");
        ProjectionLoc = gl.getUniformLocation(prog, "projection");
        NormalMatrixLoc = gl.getUniformLocation(prog, "normalMatrix");
        
        uTexture = gl.getUniformLocation(prog, "texture");//ajouté pour la texture
        ScaleLoc = gl.getUniformLocation(prog, "scale");//scale tétraedre
        alphaLoc = gl.getUniformLocation(prog, "alpha");
        gl.uniform1f(alphaLoc, 1.0);

        gl.uniformMatrix4fv(ProjectionLoc, false, flatten(projection));  // send projection matrix to the shader program

        gl.enableVertexAttribArray(ScaleLoc);

        gl.enableVertexAttribArray(CoordsLoc);
        gl.enableVertexAttribArray(NormalLoc);
		gl.enableVertexAttribArray(TexCoordLoc);

		// LOAD THIRD SHADER (emissive)

        var vertexShaderSource3 = getTextContent("vertex-shader");
        var fragmentShaderSource3 = getTextContent("fragment-shader");
        progE = createProgram(gl, vertexShaderSource3, fragmentShaderSource3);
        gl.useProgram(progE);
        // locate variables for further use
        CoordsLocE = gl.getAttribLocation(progE, "vcoords");
        ModelviewLocE = gl.getUniformLocation(progE, "modelview");
        ProjectionLocE = gl.getUniformLocation(progE, "projection");

        gl.uniformMatrix4fv(ProjectionLocE, false, flatten(projection));  // send projection matrix to the shader program

        // LOAD FOURTH SHADER (for the environment)
        var vertexShaderSource = getTextContent("vshaderbox");
        var fragmentShaderSource = getTextContent("fshaderbox");
        progbox = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(progbox);

        aCoordsbox = gl.getAttribLocation(progbox, "vcoords");
        aNormalbox = gl.getAttribLocation(progbox, "vnormal");
        aTexCoordbox = gl.getAttribLocation(progbox, "vtexcoord");

        uModelviewbox = gl.getUniformLocation(progbox, "modelview");
        uProjectionbox = gl.getUniformLocation(progbox, "projection");

        uEnvbox = gl.getUniformLocation(progbox, "skybox");
		
		/////////////////////////////////en of loading shaders
		gl.useProgram(prog);
        gl.enable(gl.DEPTH_TEST);

        initTexture();//ajouté pour les textures

		gl.uniform4fv(gl.getUniformLocation(prog, "lightPosition"), flatten(lightPosition));

		// You can use basic models using the following lines

        sphere = createModel(uvSphere(10.0, 25.0, 25.0));
        cylinder = createModel(uvCylinder(10.0, 20.0, 25.0, false, false));
        modifiedCylinder = createModel(uvCylinder(10.0, 20.0, 25.0, false, true))
        box = createModel(cube(10.0));
        hemisphereinside = createModel(uvHemisphereInside(10.0, 25.0, 25.0));
		hemisphereoutside = createModel(uvHemisphereOutside(10.0, 25.0, 25.0));
        thindisk = createModel(ring(9.5, 10.0, 25.0));
		hemisphereE = createEmissiveModel(uvHemisphereOutside(10.0, 25.0, 25.0));
        cylinderE = createEmissiveModel(uvCylinder(10.0, 20.0, 25.0, false, false));
		vitreMap = createModelmap(uvHemisphereOutside(10.0, 25.0, 25.0));
		cubeMap = createModelmap(cube(10.0));
		envbox = createModelbox(cube(1000.0));

		for(i=0; i<numNodes; i++) initNodes(i);
		
		    document.getElementById("slider0").onchange = function() {
		    theta[0] = event.srcElement.value;
		    initNodes(rightWingID);
		    initNodes(leftWingID);
		    render();
		};
		    document.getElementById("slider1").onchange = function() {
		    theta[1] = event.srcElement.value;
		    initNodes(leftTopPlateID);
		    initNodes(rightTopPlateID);
		    initNodes(leftBottomPlateID);
		    initNodes(rightBottomPlateID);
		    render();
		};

		setInterval(turnMoonAndRender,50);
		//render();
    }
    catch (e) {
        document.getElementById("message").innerHTML =
             "Could not initialize WebGL: " + e;
        return;
    }
    document.addEventListener("keydown", doKey, false);  // add a callback function (when a key is pressed)

}



