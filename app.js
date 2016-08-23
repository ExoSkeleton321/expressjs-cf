var express = require('express');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var app_password = "123";


//subir imagenes a la nube
var cloudinary = require("cloudinary"); 

//config cloudinary
cloudinary.config({ 
  cloud_name: 'dhjxgsbe1', 
  api_key: '721267265932689', 
  api_secret: 'iYNFDifHkSjAcEqUCF-90qnNZFQ' 
});

//para poder leer imagenes desde un form con enctype y subirlas
var multer = require("multer"); 
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + ".png");
  }
});
var upload = multer({ storage: storage });

//Start app
var app = express();
app.set("view engine", "jade");

//User a parser to be able to read post request easy
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Tell express where our assetes will be
app.use(express.static("public"));

//Connect to mongodb
mongoose.connect("mongodb://localhost/primera_pagina");

//Definir schema de nuestros productos (tabla)
var productSchema = {
	title: String,
	description: String,
	imageUrl: String,
	pricing: Number
};

//Model of the product (used to be able to save data to database)
var Product = mongoose.model("Product", productSchema);

//This goes into the views folder i created to find the file
app.get("/", function(request, response){
	response.render("index");
});

app.get("/productos/new", function(request, response){
	response.render("productos/new");
});

//The second parameter is to upload the image
app.post("/productos", upload.single('image_avatar'), function(request, response){
	//console.log(request.body);

	if(request.body.password == app_password){
		//Save a product
		var data = {
			title: request.body.title,
			description: request.body.description,
			imageUrl: "data.png",
			pricing: request.body.price
		};

		var product = new Product(data);
		
		//console.log(request.file);

		if(request.file){
			cloudinary.uploader.upload(request.file.path, function(result){ 
				product.imageUrl = result.url;

				//Save image whe image is uploaded
			  	product.save(function(err){
					//console.log(product);
					Product.find(function(error, products){
						if(error){console.log(error);}
						response.render("productos/index", { products: products });
					});
				});
			});
		}else{
			product.save(function(err){
				//console.log(product);
				Product.find(function(error, products){
					if(error){console.log(error);}
					response.render("productos/index", { products: products });
				});
			});
		}

		
	}else{
		response.render("productos/new");
	}
});

app.get("/productos", function(request, response){
	//Get all products from database
	Product.find(function(error, documento){
		if(error){console.log(error);}

		//Pass the variable products the document (result from query) to the view
		response.render("productos/index", { products: documento });
	});
});

app.get("/admin", function(request, response){
	response.render("admin/form");
});

app.post("/admin", function(request, response){
	if(request.body.password == app_password){
		Product.find(function(error, document){
			if(error){console.log(error);}
			response.render("admin/index", { products: document });
		});
	}else{
		response.redirect("/");
	}
});

app.get("/productos/edit/:id", function(request, response){
	var prod_id = request.params.id
	//console.log(prod_id);
	
	Product.findOne({"_id": prod_id}, function(error, documento){
		//console.log(documento);
		response.render("productos/edit", {product: documento});
	});
});

//USE THE SECOND PARAMETER EVERTIME THEIR IS AN ENCTYPE IN THE FORM SUBMITTED
app.post("/edit-product/:id", upload.single("image_avatar"), function(request, response){
	//console.log(request.body);

	if(request.body.password == app_password){
		if(request.file){
			var data = {
				title: request.body.title,
				description: request.body.decription,
				imageUrl: "data.png",
				pricing: request.body.price
			};

			var product = new Product(data);

			cloudinary.uploader.upload(request.file.path, function(result){ 
				product.imageUrl = result.url;

				//Save image whe image is uploaded
			  	Product.update({"_id": request.params.id}, data, function(){
					Product.find(function(error, document){
						if(error){console.log(error);}
						response.render("admin/index", { products: document });
					});
				});
			});
		}else{
			var data = {
				title: request.body.title,
				description: request.body.decription,
				pricing: request.body.price
			};

			Product.update({"_id": request.params.id}, data, function(){
				Product.find(function(error, document){
					if(error){console.log(error);}
					response.render("admin/index", { products: document });
				});
			});
		}
	}else{
		response.redirect("/");
	}
});

app.get("/productos/eliminar/:id", function(request, response){
	var prod_id = request.params.id;

	Product.findOne({"_id": prod_id}, function(error, product){
		response.render("admin/delete", {product: product});
	});
});

app.post("/productos/eliminar/:id", function(request, response){
	var prod_id = request.params.id;

	if(request.body.password == app_password){
		//console.log("delete prodcuto");
	
		Product.remove({"_id": prod_id}, function(error){
			if(error){console.log(error);}
			response.redirect("/admin");
		});	
	}else{
		response.redirect("/");
	}
});

app.get("/home", function(request, response){
	response.render("home");
});

app.get("/contacto", function(request, response){
	response.render("contacto");
});

app.get("/acerca", function(request, response){
	response.render("acerca");
});

app.listen(8080);