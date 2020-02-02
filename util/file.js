const fs = require('fs');

const deleteFile = (path) => {
    fs.unlink(path, (err) => {
        if (err) {
            throw new Error(err);
        }
    })
}

exports.deleteFile = deleteFile;