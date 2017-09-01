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
        "<h3>Information sur la commande :</h3>"+
        "<div class='row'>"+
            "<div class='col-sm-6'>"+
                "<p>Expediteur</p>"+
                "<p>Sogeti</p>"+
                "<p>11 allée Georges Braque</p>"+
            "</div>"+
            "<div class='col-sm-6'>"+
                "<div style ='float:right'>"+
                    "<p>Destinataire</p>"+
                    "<p>"+command.clientname+" "+command.clientlastname+"</p>"+
                    "<p>"+command.clientDeliveryAddress+"</p>"+
                "</div>"+
            "</div>"+
        "</div>"+
        "<h3>Préparation du collissage :</h3>"+
            "<p>Dimensions : "+command.collis.dimension+" m</p>"+
            "<p>Poids : "+command.collis.poids+" kg</p>"+
        "<h3>Information sur le transport :</h3>"+
        "<div class='form-group'>"+  
            "<input id='tracking' type='text' placeholder='numéro de tracking' class='form-control input-md'>"+  
        "</div>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='validTransport'>Valider transport</button>"+
        "</div>"
    );

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
        "<h3>Information sur la commande :</h3>"+
        "<div class='row'>"+
            "<div class='col-sm-6'>"+
                "<p>Expediteur</p>"+
                "<p>Sogeti</p>"+
                "<p>11 allée Georges Braque</p>"+
            "</div>"+
            "<div class='col-sm-6'>"+
                "<div style ='float:right'>"+
                    "<p>Destinataire</p>"+
                    "<p>"+command.clientname+" "+command.clientlastname+"</p>"+
                    "<p>"+command.clientDeliveryAddress+"</p>"+
                "</div>"+
            "</div>"+
        "</div>"+
        "<h3>Préparation du collissage :</h3>"+
            "<p>Dimensions : "+command.collis.dimension+" m</p>"+
            "<p>Poids : "+command.collis.poids+" kg</p>"+
        "<h3>Information sur le transport :</h3>"+
        "<p>Numéro de tracking : "+command.trackingID+"</p>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='validDelivery'>Valider livraison</button>"+
        "</div>"
    );
    
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
        "<h3>Information sur la commande :</h3>"+
        "<div class='row'>"+
            "<div class='col-sm-6'>"+
                "<p>Expediteur</p>"+
                "<p>Sogeti</p>"+
                "<p>11 allée Georges Braque</p>"+
            "</div>"+
            "<div class='col-sm-6'>"+
                "<div style ='float:right'>"+
                    "<p>Destinataire</p>"+
                    "<p>"+command.clientname+" "+command.clientlastname+"</p>"+
                    "<p>"+command.clientDeliveryAddress+"</p>"+
                "</div>"+
            "</div>"+
        "</div>"+
        "<h3>Préparation du collissage :</h3>"+
            "<p>Dimensions : "+command.collis.dimension+" m</p>"+
            "<p>Poids : "+command.collis.poids+" kg</p>"+
        "<h3>Information sur le transport :</h3>"+
        "<p>Numéro de tracking : "+command.trackingID+"</p>"
    );

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