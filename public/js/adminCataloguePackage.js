var $ = require("jquery");
require('bootstrap-loader');
var URL = require("../../url.json");

var user;
var products;

window.addEventListener('load', function() {
    $("#newProduct").click(modalNew);
    loadProducts(function(){
        $(".card").click(modal);
    });
});

loadProducts = function(callback){
    $.get(URL.url+"/product", function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur lors du chargement des données");
            else if(data == "none")
                alert("Aucun produit dans le catalogue");
            else{
                console.log(data);
                products = data;
                $("#scroll-container").empty();

                for(var i=0; i<data.length; i++){
                    $("#scroll-container").append(
                        "<div class='col-sm-4 container-card'>"+
                            "<div class='card' name="+i+">"+
                                "<p>Descriptif : "+products[i].description+"</p>"+
                                "<p>Réference : "+products[i].ref+"</p>"+
                                "<p>Prix : "+products[i].price+" €</p>"+
                                "<p>Stock : "+products[i].quantity+"</p>"+
                            "</div>"+
                        "</div>"
                    );
                }
                callback();
            }
        }
        else {
            alert("Erreur lors du chargement des données");
        }
    });
 
    return false;
}

modal = function(){
    var index = $(this).attr("name");
    var product = products[index];
    console.log(index);
    console.log(product);
    
    $(".modal-body").html(
        "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
        "<p>Descriptif produit : "+product.description+"</p>"+
        "<p>Réference produit : "+product.ref+"</p>"+
        "<p>Prix unitaire : "+product.price+" €</p>"+
        "<p>Stock disponible : "+product.quantity+"</p>"+
        "<p>Stock critique : "+product.critical+"</p>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-5 col-sm-2' id='editProduct'>Modifier</button>"+
        "</div>"
    );

    $("#editProduct").click({index : index}, function(event){
        console.log(event.data.index);
        $(".modal-body").html(
            "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
            "<div class='form-group'>"+  
                    "<input id='descriptif' type='text' placeholder='Descriptif produit' class='form-control input-md'>"+  
            "</div>"+
            "<div class='form-group'>"+  
                "<input id='ref' type='text' placeholder='Réference produit' class='form-control input-md'>"+  
            "</div>"+
            "<div class='form-group'>"+  
                    "<input id='price' type='number' placeholder='Prix unitaire' class='form-control input-md'>"+  
            "</div>"+
            "<div class='form-group'>"+  
                "<input id='stock' type='number' placeholder='Stock disponible' class='form-control input-md'>"+  
            "</div>"+
            "<div class='form-group'>"+  
                    "<input id='critical' type='number' placeholder='Stock critique' class='form-control input-md'>"+  
            "</div>"+
            "<div class='row'>"+    
                "<button type='button' class='btn btn-success col-sm-offset-5 col-sm-2' id='validNewProduct'>Valider</button>"+
            "</div>"
        );

        $("#validNewProduct").click({index : index}, modifyProduct);
    });

    $("#myModal").modal("show");
    return false; 
}

modalNew = function() {
    $(".modal-body").html(
        "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
       "<div class='form-group'>"+  
                "<input id='descriptif' type='text' placeholder='Descriptif produit' class='form-control input-md'>"+  
        "</div>"+
        "<div class='form-group'>"+  
            "<input id='ref' type='text' placeholder='Réference produit' class='form-control input-md'>"+  
        "</div>"+
        "<div class='form-group'>"+  
                "<input id='price' type='number' placeholder='Prix unitaire' class='form-control input-md'>"+  
        "</div>"+
        "<div class='form-group'>"+  
            "<input id='stock' type='number' placeholder='Stock disponible' class='form-control input-md'>"+  
        "</div>"+
        "<div class='form-group'>"+  
                "<input id='critical' type='number' placeholder='Stock critique' class='form-control input-md'>"+  
        "</div>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-5 col-sm-2' id='validNewProduct'>Valider</button>"+
        "</div>"
    );

    $("#validNewProduct").click(newProduct);

    $("#myModal").modal("show");
    return false;
}

newProduct = function() {
    $.post(URL.url+"/newProduct",
    {
        descriptif : $("#descriptif").val(),
        ref : $("#ref").val(),
        price : $("#price").val(),
        stock : $("#stock").val(),
        critical : $("#critical").val()
    },
    function(data, status){
        if(status == "success"){
            if(data == true){
                loadProducts(function(){
                    $(".card").click(modal);
                });
                alert("Produit ajouté au catalogue"); 
            }
            else alert("Erreur lors de l'ajout du produit au catalogue");
        }
    });

    $("#myModal").modal("hide");
}

modifyProduct = function(event) {
    console.log(event.data.index);
    $.post(URL.url+"/modifyProduct",
    {
        curentref : products[event.data.index].ref,
        descriptif : $("#descriptif").val(),
        ref : $("#ref").val(),
        price : $("#price").val(),
        stock : $("#stock").val(),
        critical : $("#critical").val()
    },
    function(data, status){
        if(status == "success"){
            if(data == true) alert("Produit ajouté au catalogue");
            else alert("Erreur lors de l'ajout du produit au catalogue");
        }
    });

    loadProducts(function(){
        $(".card").click(modal);
    });

    $("#myModal").modal("hide");
}
