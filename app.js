var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var multer = require('multer');
var cloudinary = require("cloudinary");
var method_override = require("method-override");
var app_password = "12345678";
var Schema = mongoose.Schema;

cloudinary.config({
	cloud_name: "codigofacilito",
	api_key: "692877912266946",
	api_secret: "v0J8Ree2n0af_zIUcpE23Rh8eD8"
});

var app = express();

mongoose.connect("mongodb://localhost/primera");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({dest: "./uploads"}));
app.use(method_override("_method"));

//Definir el schema de nuestros productos
var productSchemaJSON = {
	title:String,
	description:String,
	imageUrl: String,
	pricing: Number
};

var productSchema = new Schema(productSchemaJSON);

productSchema.virtual("image.url").get(function(){
	if(this.imageUrl === "" || this.imageUrl === "data.png"){
		return "default.jpg";
	}

	return this.imageUrl;
});

var Product = mongoose.model("Product", productSchema);

app.set("view engine","jade");

app.use(express.static("public"));

app.get("/",function(solicitud,respuesta){
	respuesta.render("index");
});

app.get("/menu",function(solicitud,respuesta){
	Product.find(function(error,documento){
		if(error){ console.log(error); }
		respuesta.render("menu/index",{ products: documento })
	});
});

app.put("/menu/:id",function(solicitud,respuesta){
	if(solicitud.body.password == app_password){
		var data = {
			title: solicitud.body.title,
			description: solicitud.body.description,
			pricing: solicitud.body.pricing
		};

		if(solicitud.files.hasOwnProperty("image_avatar")){
			cloudinary.uploader.upload(solicitud.files.image_avatar.path, 
				function(result) {
					data.imageUrl = result.url;
					
					Product.update({"_id": solicitud.params.id},data,function(product){
						respuesta.redirect("/menu");
					});
				}
			);			
		}else{
			Product.update({"_id": solicitud.params.id},data,function(product){
				respuesta.redirect("/menu");
			});
		}	


	}else{
		respuesta.redirect("/");
	}
});

app.get("/menu/edit/:id",function(solicitud,respuesta){
	var id_producto = solicitud.params.id;
	console.log(id_producto);
	Product.findOne({"_id": id_producto},function(error,producto){
		console.log(producto);
		respuesta.render("menu/edit",{ product: producto });
	});

});

app.post("/admin",function(solicitud,respuesta){
	if(solicitud.body.password == app_password){
		Product.find(function(error,documento){
			if(error){ console.log(error); }
			respuesta.render("admin/index",{ products: documento })
		});
	}else{
		respuesta.redirect("/");
	}
});

app.get("/admin",function(solicitud,respuesta){
	respuesta.render("admin/form");
});

app.post("/menu",function(solicitud,respuesta){
	if(solicitud.body.password == app_password){
		var data = {
			title: solicitud.body.title,
			description: solicitud.body.description,
			pricing: solicitud.body.pricing
		}

		var product = new Product(data);

		if(solicitud.files.hasOwnProperty("image_avatar")){
			cloudinary.uploader.upload(solicitud.files.image_avatar.path, 
				function(result) {
					product.imageUrl = result.url;
					
					product.save(function(err){
						console.log(product);
						respuesta.redirect("/menu");
					});
				}
			);
		}else{
			product.save(function(err){
				console.log(product);
				respuesta.redirect("/menu");
			});
		}

		
	}else{
		respuesta.render("menu/new");
	}

	
});

app.get("/menu/new",function(solicitud,respuesta){
	respuesta.render("menu/new");
});

app.get("/menu/delete/:id",function(solicitud,respuesta){
	var id = solicitud.params.id;

	Product.findOne({"_id": id },function(err,producto){
		respuesta.render("menu/delete",{ producto: producto });
	});

});



app.delete("/menu/:id",function(solicitud,respuesta){
	var id = solicitud.params.id;
	if(solicitud.body.password == app_password){
		Product.remove({"_id": id },function(err){
			if(err){ console.log(err); }
			respuesta.redirect("/menu");
		});
	}else{
		respuesta.redirect("/menu");
	}
});




app.listen(8080);