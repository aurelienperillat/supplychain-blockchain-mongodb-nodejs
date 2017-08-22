var $ = require("jquery");
require('bootstrap-loader');
var URL = require("../../url.json");

var user;
var commands;

window.addEventListener('load', function() {
    loadCommands(function(){
        $(".card-left").click(modalLeft);
        $(".card-middle").click(modalMiddle);
        $(".card-right").click(modalRight);
        sizeBoard();
    });
});

loadCommands = function(callback){
    $.get(URL.url+"/command-transporteur", function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur lors du chargement des données");
            else if(data == "none")
                alert("Aucune commande en cours de traitement");
            else{
                console.log(data);
                commands = data;

                $("#left-list").empty();
                $("#middle-list").empty();
                $("#right-list").empty();

                for(var i=0; i<data.length; i++){
                    if(data[i].statut == 2){
                        $("#left-list").prepend(
                            "<li class='card card-left' name="+i+">"+
                                "<p>Reférence : "+data[i]._id+"</p>"+
                                "<p>Date : "+data[i].date+"</p>"+
                                "<p>Client : "+data[i].clientname+" "+data[i].clientlastname+"</P>"+
                                "<p>Entreprise : "+data[i].clientcompany+"</p>"+ 
                            "</li>"
                        );
                    }
                    if(data[i].statut == 3){
                        $("#middle-list").prepend(
                            "<li class='card card-middle' name="+i+">"+
                                "<p>Reférence : "+data[i]._id+"</p>"+
                                "<p>Date : "+data[i].date+"</p>"+
                                "<P>Client : "+data[i].clientname+" "+data[i].clientlastname+"</P>"+ 
                                "<p>Entreprise : "+data[i].clientcompany+"</p>"+
                                "<p>N° Tracking : "+data[i].trackingID+"</p>"+
                            "</li>"
                        );
                    }
                    if(data[i].statut == 4){
                        $("#right-list").prepend(
                            "<li class='card card-right' name="+i+">"+
                                "<p>Reférence : "+data[i]._id+"</p>"+
                                "<p>Date : "+data[i].date+"</p>"+
                                "<P>Client : "+data[i].clientname+" "+data[i].clientlastname+"</P>"+
                                "<p>Entreprise : "+data[i].clientcompany+"</p>"+ 
                                "<p>N° Tracking : "+data[i].trackingID+"</p>"+
                            "</li>"
                        );
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

modalLeft = function(){
    var index = $(this).attr("name");
    var command = commands[index];
    console.log(index);
    console.log(command);
    
    $(".modal-body").html(
        "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
        "<p>Reférence : "+command._id+"</p>"+
        "<p>Date : "+command.date+"</p>"+
        "<P>Client : "+command.clientname+" "+command.clientlastname+"</P>"+
        "<P>Adresse client : "+command.clientDeliveryAddress+"</p>"+
        "</br>"+
        "<p>Détail de la commande :</p>"+
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
        "<p>Total : "+command.totalprice+" €</p></br>"+
        "<div class='form-group'>"+  
            "<input id='tracking' type='text' placeholder='numéro de tracking' class='form-control input-md'>"+  
        "</div>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='validTransport'>Valider transport</button>"+
        "</div>"
    );
    
    for(var i=0; i<command.products.refs.length; i++){
        $("#modal-table").append(
            "<tr>"+
                "<td>"+command.products.descriptifs[i]+"</td>"+
                "<td>"+command.products.refs[i]+"</td>"+
                "<td>"+command.products.quantities[i]+"</td>"+
                "<td>"+command.products.prices[i]+" €</td>"+
            "</tr>"
        );
    }

    $("#validTransport").click({index : index}, validTransport);

    $("#myModal").modal("show");
    return false; 
}

modalMiddle = function() {
    var index = $(this).attr("name");
    var command = commands[index];
    console.log(index);
    console.log(command);
    
    $(".modal-body").html(
       "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
        "<p>Reférence : "+command._id+"</p>"+
        "<p>Date : "+command.date+"</p>"+
        "<P>Client : "+command.clientname+" "+command.clientlastname+"</P>"+
        "<P>Adresse client : "+command.clientDeliveryAddress+"</p>"+
        "</br>"+
        "<p>Détail de la commande :</p>"+
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
        "<p>Total : "+command.totalprice+" €</p></br>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='validDelivery'>Valider livraison</button>"+
        "</div>"
    );

    for(var i=0; i<command.products.refs.length; i++){
        $("#modal-table").append(
            "<tr>"+
                "<td>"+command.products.descriptifs[i]+"</td>"+
                "<td>"+command.products.refs[i]+"</td>"+
                "<td>"+command.products.quantities[i]+"</td>"+
                "<td>"+command.products.prices[i]+" €</td>"+
            "</tr>"
        );
    }
    
    $("#validDelivery").click({index : index}, validDelivery);

    $("#myModal").modal("show");
    return false;
}

modalRight = function() {
    var index = $(this).attr("name");
    var command = commands[index];
    console.log(index);
    console.log(command);

    $(".modal-body").html(
        "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
        "<p>Reférence : "+command._id+"</p>"+
        "<p>Date : "+command.date+"</p>"+
        "<P>Client : "+command.clientname+" "+command.clientlastname+"</P>"+
        "<P>Adresse client : "+command.clientDeliveryAddress+"</p>"+
        "</br>"+
        "<p>Détail de la commande :</p>"+
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
        "<p>Total : "+command.totalprice+" €</p></br>"+
        "</br>"+
        "<p>collis :</p>"+
        "<P>&nbsp;&nbsp;&nbsp;&nbsp;poids : "+command.collis.poids+" kg</p>"+
        "<P>&nbsp;&nbsp;&nbsp;&nbsp;dimension : "+command.collis.dimension+" m³</p>"+
        "</br>"+
        "<p>TrackingID : " + command.TrackingID +"</p>"+
        "<div class='row'>"+    
        "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='archivOrder'>Archiver transport</button>"+
        "</div>"
    );

    for(var i=0; i<command.products.refs.length; i++){
        $("#modal-table").append(
            "<tr>"+
                "<td>"+command.products.descriptifs[i]+"</td>"+
                "<td>"+command.products.refs[i]+"</td>"+
                "<td>"+command.products.quantities[i]+"</td>"+
                "<td>"+command.products.prices[i]+" €</td>"+
            "</tr>"
        );
    }

    //$("#archivOrder").click(archivOrder);
    
    $("#myModal").modal("show");
    return false; 
}

validTransport = function(event) {
    console.log(event.data.index);
    $.post(URL.url+"/validTransport",{
       id : commands[event.data.index]._id,
       trackingID : $("#tracking").val() 
    }, function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur au cours de la validation du transport");
            else{
                $("#myModal").modal("hide");
                loadCommands(function(){
                    $(".card-left").click(modalLeft);
                    $(".card-middle").click(modalMiddle);
                    $(".card-right").click(modalRight);
                    alert("validation du transport réussi");
                });
            }
        }
        else {
            alert("Erreur au cours de la validation du transport");
        }
    });
}

validDelivery = function(event) {
    console.log(event.data.index);
    $.get(URL.url+"/validDelivery/"+commands[event.data.index]._id, function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur au cours de la validation de la livraison");
            else{
                $("#myModal").modal("hide");
                loadCommands(function(){
                    $(".card-left").click(modalLeft);
                    $(".card-middle").click(modalMiddle);
                    $(".card-right").click(modalRight);
                });
            }
        }
        else {
            alert("Erreur au cours de la validation de la livraison");
        }
    });
 
    return false;
}

sizeBoard = function() {
    var maxHeight = $("#scroll-container").height();
    $(".middle-orders").height(maxHeight);
}