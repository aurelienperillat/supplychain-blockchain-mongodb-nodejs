var $ = require("jquery");
require('bootstrap-loader');
var URL = require("../../url.json");
var user;
var products;

window.addEventListener('load', function() {
    $("#panier").click(modalPanier);
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
        "<form class='form-horizontal' onsubmit='return false;'>"+
            "<div class='form-group'>"+
                "<input id='quantity' type='text' placeholder='Quantité' class='form-control input-md'>"+  
            "</div>"+
             "<div class='form-group'>"+
                "<span id='total-price'>Prix total : </span>"+
            "</div>"+
            "<div class='form-group'>"+
                "<button id='addProduct' type='button' class='btn btn-success'>Ajouter au panier</button>"+
            "</div>"+
        "</form>"
    );

    $("#quantity").change(function(){
        quantity = $(this).val();
        if(quantity > product.quantity)
            alert("Quantité en stock insuffisante pour satisfaire votre demande");
        else {
            var price = quantity * product.price;
            $("#total-price").text("Prix total : "+price+" €");
            
        }
    });

    $("#addProduct").click({
        product : product
    }, addProduct);

    $("#myModal").modal("show");
    return false; 
}

addProduct = function(event){
    console.log(event.data.product);
    $("#myModal").modal("hide");

    $.post(URL.url+"/addProduct",
    {
        product : event.data.product,
        quantity : $("#quantity").val()
    },
    function(data, status){
        if(status == "success"){
            if(data == true) alert("Elément ajouté au panier");
            else alert("Erreur lors de l'ajout au panier");
        }
    });
    
    return false;
}

modalPanier = function(){
    $.get(URL.url+"/panier", function(data, status){
        if(status == "success"){
            if(data.length < 1)
                alert("panier vide");
            else{
                $(".modal-body-panier").html(
                    "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
                    "<table class='table'>"+
                        "<thead>"+
                            "<tr>"+
                                "<th>Descriptif produit</th>"+
                                "<th>Reférence produit</th>"+
                                "<th>Quantité</th>"+
                                "<th>Prix unitaire</th>"+
                            "</tr>"+
                        "</thead>"+
                        "<tbody id='modal-table'></tbody>"+
                    "</table>"+
                    "<p>Total : "+data.panierPrice+" €</p></br>"+
                    "<div class='row'>"+    
                        "<button type='button' class='btn btn-success col-sm-offset-5 col-sm-2' id='valid'>Valider panier</button>"+
                    "</div>"
                );

                for(var i=0; i<data.panier.length; i++){
                    $("#modal-table").append(
                        "<tr>"+
                            "<td>"+data.panier[i].product.descriptif+"</td>"+
                            "<td>"+data.panier[i].product.ref+"</td>"+
                            "<td>"+data.panier[i].quantity+"</td>"+
                            "<td>"+data.panier[i].product.price+" €</td>"+
                        "</tr>"
                    );
                }

                $("#valid").click(validPanier);
                $("#modalPanier").modal("show");
            }
        }
    });

    return false;
}

validPanier = function() {
    $("#modalPanier").modal("hide");
    $.post(URL.url+"/panier", {}, function(data, status){
        if(status == "success"){
            if(data == true) alert("Commande validée");
            else alert("Erreur lors de la validation de la commande");
        }
    });
}