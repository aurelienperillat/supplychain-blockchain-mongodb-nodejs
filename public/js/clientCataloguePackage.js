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
    getUser();
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
                                "<p>Prix unitaire : "+products[i].price+" €</p>"+
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
        "<h2>Ajouter cet article au panier</h2>"+
        "<form class='form-inline' onsubmit='return false;'>"+
            "<div class='form-group'>"+
                "<label for='quantity'>Quantité souhaitée</label>"+
                "<input id='quantity' type='number' class='form-control'>"+  
            "</div>"+
        "</form>"+
        "<p id='total-price'>Prix total : </p>"+
        "<button id='addProduct' type='button' class='btn btn-success col-sm-offset-4 col-sm-4'>Ajouter au panier</button>"
    );

    $("#quantity").change(function(){
        quantity = $(this).val();
        if(quantity > product.quantity)
            alert("Quantité en stock insuffisante pour satisfaire votre demande");
        else {
            var price = quantity * product.price;
            $("#total-price").text("Montant total : "+price+" €");
            
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
                    "<p>client : "+user.name+" "+user.lastname+"</p>"+
                    "<p>adresse : "+user.deliveryaddress+"</p>"+
                    "<table class='table'>"+
                        "<thead>"+
                            "<tr>"+
                                "<th>Descriptif produit</th>"+
                                "<th>Reférence produit</th>"+
                                "<th>Quantité</th>"+
                                "<th>Prix unitaire</th>"+
                                "<th>Montant total</th>"+
                            "</tr>"+
                        "</thead>"+
                        "<tbody id='modal-table'></tbody>"+
                    "</table>"+
                    "<p>Montant Total : "+data.panierPrice+" €</p></br>"+
                    "<div class='row'>"+    
                        "<button type='button' class='btn btn-success col-sm-offset-5 col-sm-2' id='valid'>Valider commande</button>"+
                    "</div>"
                );

                for(var i=0; i<data.panier.length; i++){
                    $("#modal-table").append(
                        "<tr>"+
                            "<td>"+data.panier[i].product.descriptif+"</td>"+
                            "<td>"+data.panier[i].product.ref+"</td>"+
                            "<td>"+data.panier[i].quantity+"</td>"+
                            "<td>"+data.panier[i].product.price+" €</td>"+
                            "<td>"+(data.panier[i].product.price*data.panier[i].quantity)+" €</td>"+
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

getUser = function() {
    $.get(URL.url+"/getUser", function(data, status){
        if(status == "success"){
            if(data != null) user = data;
            else alert("Erreur lors de la validation de la commande");
        }
    });
}