var $ = require("jquery");
require('bootstrap-loader');
var URL = require("../../url.json");

var user;
var products;

window.addEventListener('load', function() {
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
                                "<p>Descriptif : "+products[i].descriptif+"</p>"+
                                "<p>Réference : "+products[i].ref+"</p>"+
                                "<p>Prix : "+products[i].price+" €</p>"+
                                "<p>Stock : "+products[i].quantity+"</p>"+
                            "</div>"+
                        "</div>"
                    );

                    if(products[i].provision > 0){
                        $(".card[name="+i+"]").append("<P class='vignette'>auto</p>");
                    }
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
        "<h2>Configurer une règle de réapprovisionement</h2>"+
        "<p>Descriptif produit : "+product.descriptif+"</p>"+
        "<p>Réference produit : "+product.ref+"</p>"+
        "<p>Prix unitaire : "+product.price+" €</p>"+
        "<div class='form-group'>"+  
                "<input id='provision' type='number' placeholder='Quantité de réapprovisionnement' class='form-control input-md'>"+  
        "</div>"+
        "<div class='form-group'>"+
            "<span id='total-price'>Prix total : </span>"+
        "</div>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='addRule'>Créer la règle</button>"+
        "</div>"
    );

    $("#provision").change(function(){
        quantity = $(this).val();
        var price = quantity * product.price;
        $("#total-price").text("Prix total : "+price+" €");
    });

    $("#addRule").click({
        product : product
    }, addRule);

    $("#myModal").modal("show");
    return false; 
}

addRule = function(event) {
    console.log(event.data.product);
    $("#myModal").modal("hide");

    $.post(URL.url+"/addRule",
    {
        product : event.data.product,
        provision : $("#provision").val()
    },
    function(data, status){
        if(status == "success"){
            if(data == true) alert("Règle ajoutée au produit");
            else alert("Erreur lors de l'ajout d'une règle au produit");
        }
    });
    
    return false;
}