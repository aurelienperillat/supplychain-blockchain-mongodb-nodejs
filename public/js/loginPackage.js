var $ = require("jquery");
var URL = require("../../url.json");



window.addEventListener('load', function() {
    $("#login").click(login);
    $("#signin2").click(signin);
    $('#selectType2').change(userTypeListener);
});

login = function(){
    var typeVal = $('#selectType1').val();
    var addressVal = $('#adresse').val();
    var passwordVal = $('#password1').val();
    
    console.log("type:" + typeVal);
    console.log("address:" + addressVal);
    console.log("password:" + passwordVal);
    
    $.post(URL.url+"/login",
    {
        type: typeVal,
        address: addressVal,
        password: passwordVal
    },
    function(data, status){
        console.log(status);
        if(status == "success"){
            if(data == false)
                alert("Informations incorrectes");
            else{
                document.location.href = URL.url+"/home/"+typeVal;
                console.log("Informations correctes");
            }
        }
        else {
            alert("Erreur lors de l'execution de la requette, veuillez réessayer");
        }
    });
 
    return false;          
}

signin = function(){
    var typeVal = $('#selectType2').val();
    var addressVal = $('#adresse_bc').val();
    var nameVal = $('#name').val();
    var lastNameVal = $('#lastName').val();
    var passwordVal = $('#password2').val();
    var deliveryAddressVal = $('#adresse_cv').val();
    var companyVal = $("#company").val();

    console.log("type: " + typeVal);
    console.log("address: " + addressVal);
    console.log("password: " + passwordVal);
    console.log("name: " + nameVal);
    console.log("lastname: " + lastNameVal);
    console.log("password: " + passwordVal);
    console.log("deliveryadress: " + deliveryAddressVal);
    console.log("company: " + companyVal);

    $.post(URL.url+"/signin",
    {
        type: typeVal,
        address: addressVal,
        name: nameVal,
        lastname: lastNameVal,
        password: passwordVal,
        deliveryaddress: deliveryAddressVal,
        company : companyVal
    },
    function(data, status){
        if(status == "success"){
            if(data == true) alert("Inscription réussie");
            else alert("Inscription échouée");
        }
    });
    
    return false;
}

userTypeListener = function(){
    var type = $("#selectType").val();
    if(type == "1")
        $("#adresse_cv").hide();
    else
        $("#adresse_cv").show();
    return false;
}
