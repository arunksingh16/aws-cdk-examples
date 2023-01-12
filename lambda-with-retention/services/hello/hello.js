exports.main = async function(event, context){
    console.log("This is log");
    return {
        statusCode: 200,
        body: 'Hello from Lambda'
    }
    
}
