const AWS = require('aws-sdk')
const { each, get } = require('lodash')

const lambda = new AWS.Lambda({region: 'us-east-1'})

const functionsToClear = ['function-name']

const deleteVersions = (data, functionName) => {
    each(data, (functionVersion) => {
        if (functionVersion.Version === '$LATEST') {
            console.info(`ignoring $LATEST of ${functionName}`)
            return
        }
        lambda.deleteFunction({
            FunctionName: functionVersion.FunctionArn
        }, (deleteError) => {
            if (deleteError) console.error(`error deleting: ${functionVersion.FunctionArn}, ${deleteError}`)
            console.info(`DELETED: ${functionVersion.FunctionArn}`)
        })
    })
}

const deleteFunctionVersions = (index) => {
    const functionName = get(functionsToClear, index)
    lambda.listVersionsByFunction({ 
        FunctionName: functionName,
        MaxItems: 100
    },(err, data) => {
        if (err) {
            console.error(`error clearing the function: ${functionName}`)
        }
        if (get(data, 'Versions').length > 1) {
            deleteVersions(get(data, 'Versions'), functionName)
            setTimeout(deleteFunctionVersions, 5000, index + 1)
        } else {
            setTimeout(deleteFunctionVersions, 1000, index + 1)
        }
    })
}

deleteFunctionVersions(0)
