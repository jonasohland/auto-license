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


targetDir = process.argv[2];
licenseName = process.argv[3];
inputName = process.argv[4];
inputBrief = process.argv[5];

if(process.argv[2] == '--help' || process.argv[2] == '-h'){
    console.log('auto license v0.1');
    console.log('usage:');
    console.log('  node auto_license.js TARGET_DIR LICENSE_NAME OWNER BRIEF_DESCRIPTION');
} else {
    makeLicense(licenseName);
    walkDir(targetDir);
}

