$(document).ready(function(){
    console.log("we are ok!");


$("#button-submit").click(function(event){
    event.preventDefault();

    $.ajax({
        url: "/upload",
        method: "POST",

        success: function(response,status){
            alert("your file submitted succesfully")
        },
        error: function(response,status){
            alert("something went wrong")
        }
    })

})
})
