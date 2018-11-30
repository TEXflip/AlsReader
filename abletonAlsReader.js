const fs = require('fs');
const xml2js = require('xml2js');
const cmd = require('node-cmd');
const ratio = 0.001999999841569535020321384257825129452549863988069544668958641201035281850236222338457267539783701251106630;

let parser = new xml2js.Parser(), file = process.argv[2], newFile, encoding = process.platform === "win32" ? "utf-16le" : "utf8", retry = true;
if (file.substring(file.length - 4) == ".xml")
    fs.readFile("./" + file, encoding, readFile);
else if (file.substring(file.length - 4) == ".als") {
    newFile = file.substring(0, file.length - 4) + ".xml";
    file = file.replace(/ /g, '\\ ');
    cmd.get(
        "gzip -cd " + file + " > " + newFile.replace(/ /g, '\\ '),
        (err, data, stderr) => {
            file = newFile;
            fs.readFile("./" + newFile, encoding, readFile);
        }
    );
}
else {
    console.log("extension file not valid... try with '.als' or '.xml'");
    return;
}

function readFile(err, data) {
    if (!err)
        parser.parseString(data, (err, result) => {
            if (!(result == null || result == undefined)) {
                let audioClips = result.Ableton.LiveSet[0].Tracks[0].AudioTrack[0].DeviceChain[0].MainSequencer[0].Sample[0].ArrangerAutomation[0].Events[0].AudioClip;
                let clips = [];
                audioClips.forEach(element => {
                    let start = element.CurrentStart[0].$.Value;
                    let end = element.CurrentEnd[0].$.Value;
                    clips.push([start, end]);
                });
                let cuts = [];
                for (let i = 0; i < clips.length - 1; i++)
                    cuts.push([msToTime(clips[i][1] / ratio), Math.round((clips[i + 1][0] - clips[i][1]) / ratio)]);
                let print1 = [];
                cuts.forEach(e => {
                    print1.push(e[0]);
                });
                let print2 = [];
                cuts.forEach(e => {
                    print2.push(e[1]);
                });
                let print = [print1, print2];
                printForTables(print);
            }
            else {
                if (result == undefined) {
                    console.error("encoding error. retrying...");
                    reTry();
                }
                else
                    console.error("bad error");
            }
        });
    else
        if (!reTry())
            console.error("file not found");
}

function reTry(canAgain = false) {
    if (retry) {
        encoding = encoding === "utf8" ? "utf-16le" : "utf8";
        fs.readFile("./" + file, encoding, readFile);
        if (canAgain)
            retry = false;
        return true;
    }
    return false;
}

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000))
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return minutes + ":" + seconds + "." + milliseconds;
}

function printForTables(args) {
    args[0].forEach(e => {
        process.stdout.write(e + '\n');
    });
    process.stdout.write('\n');
    args[1].forEach(e => {
        process.stdout.write(e + '\n');
    });
}