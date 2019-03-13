const readline = require('readline');
const fs = require('fs');

let targetDir, inputName, inputBrief, licenseText;

class LFile extends (require('events')).EventEmitter {

    constructor(path){

        super();

        this.filepath = path;

        this.instream = fs.createReadStream(path);
        this.outstream = new (require('stream'))();

        this.rl = readline.createInterface(this.instream, this.outstream);

        this.continue = true;

        this.text = "";

        this.rl.on('line', (line) => {
            if(this.continue){
                if(line.charAt(0) == '#'){
                    this.continue = false;
                    this.text = this.text.concat(line + '\n');
                }
            } else {
                this.text = this.text.concat(line + '\n');
            }
        });

        this.rl.on('close', () => {
            this.emit('ready', this);
        });

    }

    dump(){
        return licenseText + '\n\n' + this.text;
    }
}


function doProcess(path){

    new LFile(path).on('ready', (file) => {
    
        fs.writeFile(file.filepath, file.dump(), (err) => {
            if(err)
                console.log(err);
            else
                console.log('written file: ' + file.filepath);
        });
    
    });
}

function walkDir(path){

    console.log('reading ' + path);

    fs.readdirSync(path, { withFileTypes: true }).forEach((elem, index) => {

        if(elem.isDirectory() && elem.name.charAt(0) != '.')
            walkDir(path + '/' + elem.name);

        if(elem.name.endsWith('.h') 
            || elem.name.endsWith('.cpp'))
                doProcess(path + '/' + elem.name);
    });

}

function makeLicense(licenseName){

    if(inputBrief)
        licenseText = '//\n// ' + inputBrief + '\n';
    else
        licenseText = '';

    licenseText = licenseText + fs.readFileSync(`./licenses/${licenseName}.lic`).toString('utf8');

    licenseText = licenseText.replace('@@NAME@@', inputName || "Name Here");
    licenseText = licenseText.replace('@@DATE@@', new Date().getFullYear());
}

for(let i = 2; i < process.argv.length; ++i){
    switch(i){
        case(2):
            targetDir = process.argv[2];
            break;
        case(3) :
            licenseName = process.argv[3];
            break;
        case(4) : 
            inputName = process.argv[4];
            break;
        case(5) : 
            inputBrief = process.argv[5];
            break;
    }
}

makeLicense(licenseName);
walkDir(targetDir);