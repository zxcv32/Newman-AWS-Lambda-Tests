var AWS = require('aws-sdk');
const newman = require('newman');
AWS.config.update({ region: 'ap-south-1' }); // Setting default region

exports.handler = event => {
    console.log('Running Newman');
    //runNewman();
    const response = {
        statusCode: 200,
        body: JSON.stringify('Collection run.'),
    };
    return response;
};

runNewman(); // For local testing.
function runNewman() {
    newman.run({
        collection: require('../collections/localtest.postman_collection.json'),
        //reporters: 'json',
        timeout: '2500',  // 2.5s
        timeoutRequest: '2500',     // 2.5s
        ignoreRedirects: 'false',
    }, function (err, summary) {
        var content = "all test passed";
        if (err) {
            console.log('Newman error');
            content = JSON.stringify(error, null, '  ');
        } else {
            console.log('Newman summary');
            var pass;
            var fail = summary.run.failures;
            for (var i = 0; i < fail.length; ++i) {
                var error = fail[i]['error'];
                var str = 'Name: ' + error['test'] +
                    '; Type: ' + error['name'] +
                    '; Message: ' + error['message'] +
                    '; Datetime: ' + (new Date(error['timestamp'])).toDateString();
                content = JSON.stringify(str, null, '  ');
                console.log('LOG: ' + content);
            }

            //sleep(10000);
            saveLogsToS3(content);
            rebootEc2();
            //sns();
        }
    });
}

function saveLogsToS3(content) {
    var s3 = new AWS.S3();

    var bucketName = 'bckt-nme';
    var keyName = 'lambda/utm.log';
    var params = { Bucket: bucketName, Key: keyName, Body: content };

    s3.putObject(params, function (erro, data) {
        if (erro)
            console.log(erro)
        else
            console.log("Successfully saved object to " + bucketName + "/" + keyName);
    });
}

function rebootEc2() {
    var ec2 = new AWS.EC2();

    var ec2params = { InstanceIds: ['i-0954ef9a0ef4ba500'] }; // EC2 Instance ID to be rebooted
    ec2.rebootInstances(ec2params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        }
        else {
            console.log(data);
        }
    });
}
// TODO: implement SNS
function sns() {
    var sns = new AWS.SNS();
}

// Used for adding manual wait time
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
