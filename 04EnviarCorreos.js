//Paquetes:
var azure = require('azure-storage');
var nodeoutlook = require('nodejs-nodemailer-outlook');
var Excel = require('exceljs');

//Crear conexión:
var azure2 = require('./keys_azure'); //Importación de llaves
var tableSvc = azure.createTableService(azure2.myaccount, azure2.myaccesskey);

//Tabla origen:
var tablaUsar = "botdyesatb05";

//Variables:
var contador = 0;
var contadorSeriesMax = 1;
var finalizar = false;
var array = [];
var proyecto = "COFECE-MANT";

//Crear Libro Final:
var workbookFinal = new Excel.Workbook('algo');
var worksheet = workbookFinal.addWorksheet('Hoja1');
var celdaActual = 1;

//Query:
var query = new azure.TableQuery()
    .where('PartitionKey eq ?', `${proyecto}`);
var nextContinuationToken = null;

//Programa
async function working() {

    //Reiniciar token:
    nextContinuationToken = null;

    //Excel:
    worksheet.getCell(`A${celdaActual}`).value = 'Asociado';
    worksheet.getCell(`B${celdaActual}`).value = 'Serie';
    worksheet.getCell(`C${celdaActual}`).value = 'Proyecto';
    celdaActual++;

    //Bucle:
    do {
        await promesa();
    } while (finalizar == false);
    resultado();
}

function promesa() {
    return new Promise(function(resolve, reject) { //Promesa 1

        //Blucle Tabla5:
        tableSvc.queryEntities(tablaUsar, query, nextContinuationToken, function(error, results, response) {
            if (!error) {
                results.entries.forEach(function(entry) {
                    if (entry['No_Fact']['_'] == "") {
                        if (contadorSeriesMax <= 100) {
                            //Escribir entidad en Excel:
                            worksheet.getCell(`A${celdaActual}`).value = entry['Asociado']['_'];
                            worksheet.getCell(`B${celdaActual}`).value = entry['RowKey']['_'];
                            worksheet.getCell(`C${celdaActual}`).value = entry['PartitionKey']['_'];
                            celdaActual++;
                            contadorSeriesMax++;
                        }
                    }
                    //Contador de entidades analizadas:
                    contador++;
                });
            }
            //Token que permite continuar despues de leer 1000 rows:
            if (results.continuationToken) {
                nextContinuationToken = results.continuationToken;
                resolve();
            } else {
                finalizar = true;
                resolve();
            }

        });
    });
}

//Enviar Email:
async function sendMail() {
    return new Promise(function(resolve, reject) {
        nodeoutlook.sendEmail({
            auth: {
                user: 'lrosas@mainbit.com.mx',
                pass: "Monitor.0911"
            },
            from: 'lrosas@mainbit.com.mx',
            to: "lrosas@mainbit.com.mx",
            subject: 'Correo con Series',
            html: `Buen día </br></br>Las series contenidas en este documento adjunto han sido 
            valoradas bajo los criterios de selección de cada proyecto. </br> Favor de considerar 
            las mismas para la solicitud de la factura. </br> </br> Reportar cualquier incidente a: 
            </br><strong>mjimenez@mainbit.com</strong> </br><strong>esanchezl@mainbit.com</strong>`,
            attachments: [{
                path: './series.xlsx'
            }, ],
            onError: (e) => console.log(e),
            onSuccess: (i) => console.log(i)
        });
        console.log("Correo enviado.");
        resolve();
    });
}

//Función para guardar el libro creado con los datos extraidos por el programa:
async function guardarExcel() {
    return new Promise(function(resolve, reject) {
        workbookFinal.xlsx.writeFile('series.xlsx').then(function() { //Puedes colocar cualquier nombre al archivo final sustituyendo "final.xlsx" (recuerda respetar siempre la extención .xlsx).
            console.log("¡El archivo se a creado correctamente!");
            resolve();
        });
    });
}


//Funcion que se ejecuta el final del programa:
async function resultado() {
    //sendMail();
    console.log(`Se analizaron ${contador} entidades y se enviara un correo con la información de las primeras ${contadorSeriesMax - 1}.`);

    await guardarExcel();
    await sendMail();

}

//Inicia el trabajo:
working();