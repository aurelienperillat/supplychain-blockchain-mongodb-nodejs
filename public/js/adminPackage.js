var $ = require("jquery");
require('bootstrap-loader');
var URL = require("../../url.json");

var commands;

window.addEventListener('load', function() {
    loadCommands(function(){
        $(".card-left").click(modalLeft);
        $(".card-middle").click(modalMiddle);
        $(".card-delivery").click(modalDelivery);
        $(".card-right").click(modalRight);
        sizeBoard();
    });
});

loadCommands = function(callback){
    $.get(URL.url+"/command", function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur lors du chargement des données");
            else if(data == "none")
                alert("Aucune command en cours de traitement");
            else{
                console.log(data);
                commands = data;

                $("#left-list").empty();
                $("#middle-list").empty();
                $("deliver-list").empty();
                $("#right-list").empty();

                for(var i=0; i<data.length; i++){
                    if(data[i].statut == 1){
                        $("#left-list").prepend(
                            "<li class='card card-left' name="+i+">"+
                                "<p>Reférence : "+data[i]._id+"</p>"+
                                "<p>Date : "+data[i].date+"</p>"+
                                "<p>Client : "+data[i].clientname+" "+data[i].clientlastname+"</P>"+
                                "<p>Entreprise : "+data[i].clientcompany+"</p>"+ 
                            "</li>"
                        );
                    }
                    if(data[i].statut == 2){
                        $("#middle-list").prepend(
                            "<li class='card card-middle' name="+i+">"+
                                "<p>Reférence : "+data[i]._id+"</p>"+
                                "<p>Date : "+data[i].date+"</p>"+
                                "<P>Client : "+data[i].clientname+" "+data[i].clientlastname+"</P>"+ 
                                "<p>Entreprise : "+data[i].clientcompany+"</p>"+
                            "</li>"
                        );
                        if(data[i].collis.poids > 0) {
                            $(".card[name="+i+"]").append("<P class='vignette'>transport en attente</p>");
                        }
                    }
                    if(data[i].statut == 3){
                        $("#deliver-list").prepend(
                            "<li class='card card-delivery' name="+i+">"+
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
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-3 col-sm-2' id='validOrder'>Valider</button>"+
            "<button type='button' class='btn btn-danger col-sm-offset-2 col-sm-2' id='denyOrder'>Refuser</button>"+
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
    
    $("#validOrder").click({index : index}, validOrder);
    $("#denyOrder").click({index : index}, denyOrder);

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
        "<h2>Organiser transport : </h2>"+
        "<div class='form-group'>"+
            "<label class='control-label' for='dimension'>Dimension du collis</label>"+
            "<input id='dimension' type='text' placeholder='(L x l x h) en m' class='form-control input-md'>"+  
        "</div>"+
        "<div class='form-group'>"+ 
            "<label class='control-label' for='poids'>Poids du collis</label>"+ 
            "<input id='poids' type='number' placeholder='kg' class='form-control input-md'>"+  
        "</div>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-4 col-sm-4' id='askTransport'>Demande de transport</button>"+
        "</div>"
    );

    if(command.collis.poids > 0) {
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
            "<p>N° Tracking : En attente...</p>"+
            "<p>information collis :<p>"+
            "<p>&nbsp;&nbsp;-poids : "+command.collis.poids+" kg</p>"+
            "<p>&nbsp;&nbsp;-dimensions : "+command.collis.dimension+" m³</p>"
        );
    }

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

    $("#askTransport").click({index : index}, askTransport);

    $("#myModal").modal("show");
    return false;
}

modalDelivery = function() {
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
        "<p>N° Tracking : "+command.trackingID+"</p>"+
        "<p>information collis :<p>"+
        "<p>&nbsp;&nbsp;-poids : "+command.collis.poids+" kg</p>"+
        "<p>&nbsp;&nbsp;-dimensions : "+command.collis.dimension+" m³</p>"
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
        "<p>N° Tracking : "+command.trackingID+"</p>"+
        "<p>information collis :<p>"+
        "<p>&nbsp;&nbsp;-poids : "+command.collis.poids+" kg</p>"+
        "<p>&nbsp;&nbsp;-dimensions : "+command.collis.dimension+" m³</p></br>"+
        "<div class='row'>"+    
            "<button type='button' class='btn btn-success col-sm-offset-5 col-sm-2' id='archivOrder'>Archiver</button>"+
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

    $("#archivOrder").click({index : index}, archivOrder);
    
    $("#myModal").modal("show");
    return false; 
}

validOrder = function(event) {
    console.log(event.data.index);
    $.get(URL.url+"/validOrder/"+commands[event.data.index]._id, function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur au cours de la validation");
            else{
                $("#myModal").modal("hide");
                loadCommands(function(){
                    $(".card-left").click(modalLeft);
                    $(".card-middle").click(modalMiddle);
                    $(".card-delivery").click(modalDelivery);
                    $(".card-right").click(modalRight);
                });
            }
        }
        else {
            alert("Erreur au cours de la validation");
        }
    });
 
    return false;
}

askTransport = function(event) {
    console.log(event.data.index);
    $.post(URL.url+"/askTransport",{
       id : commands[event.data.index]._id,
       poids : $("#poids").val(),
       dimension : $("#dimension").val() 
    }, function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur au cours de la demande de transport");
            else{
                $("#myModal").modal("hide");
                loadCommands(function(){
                    $(".card-left").click(modalLeft);
                    $(".card-middle").click(modalMiddle);
                    $(".card-delivery").click(modalDelivery);
                    $(".card-right").click(modalRight);
                    alert("Demande de transport réussi");
                });
            }
        }
        else {
            alert("Erreur au cours de la demande de transport");
        }
    });
}

denyOrder = function(event) {
    console.log(event.data.index);
    $.post(URL.url+"/denyOrder",{
       id : commands[event.data.index]._id,
    }, function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur au cours du refus de la commande");
            else{
                $("#myModal").modal("hide");
                loadCommands(function(){
                    $(".card-left").click(modalLeft);
                    $(".card-middle").click(modalMiddle);
                    $(".card-delivery").click(modalDelivery);
                    $(".card-right").click(modalRight);
                    alert("refus de commande réussi");
                });
            }
        }
        else {
            alert("Erreur au cours du refus de la commande");
        }
    });
}

archivOrder = function(event) {
    console.log(event.data.index);
    $.post(URL.url+"/archivOrder",{
       id : commands[event.data.index]._id,
    }, function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Erreur au cours de l'archivage de la commande");
            else{
                $("#myModal").modal("hide");
                loadCommands(function(){
                    $(".card-left").click(modalLeft);
                    $(".card-middle").click(modalMiddle);
                    $(".card-delivery").click(modalDelivery);
                    $(".card-right").click(modalRight);
                    alert("archivage de commande réussi");
                });
            }
        }
        else {
            alert("Erreur au cours de l'archivage de la commande");
        }
    });
}

sizeBoard = function() {
    var maxHeight = $("#scroll-container")[0].scrollHeight;
    $(".middle-orders").height(maxHeight);
    $(".delivery-orders").height(maxHeight);
}