export default function extractContext(){
    console.log("Extracting context");
}

if(import.meta.url === process.argv[1]){
    extractContext();
}