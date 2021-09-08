var express = require('express'); 
var app = express();
var port = process.env.port || 1337;
var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/a5e471e7f94a47aca284486ddf1e9f02"));
const factoryAbi = require('./factoryContractAbi.json');
const cohertAbi = require('./cohertContractAbi.json');
const proxyAbi = require('./proxyContractAbi.json');
const tokenList = require('./tokenList.json');
const { create, all } = require('mathjs');
const math = create(all);

app.get("/TotalStaking/:market",function(request,response)
{
    var FactoryContract;	
    var sumTotalStaking = 0;	
    var priceDollar = 0;
    var cohertAddress = request.params.market;
    async function totalStaking(){
        if (factoryAbi != ''){

            FactoryContract = new web3.eth.Contract(factoryAbi,'0xB558C3c7Af7F1d437Fe82914426a63c13c6a3a80');
            const proxyAddr = await FactoryContract.methods.unStakeHandlers(cohertAddress).call();
            CohertContract = new web3.eth.Contract(cohertAbi,cohertAddress);            
            const tokenCount = await CohertContract.methods.viewTokensCount().call();
            console.log("Total Number of Tokens in Pool : " + tokenCount);
            for(var i=0;i<tokenCount;i++){
                const tokenAddr = await CohertContract.methods.tokens(i).call();
                ProxyContract = new web3.eth.Contract(proxyAbi,proxyAddr);
                const totalStaking = await ProxyContract.methods.getTotalStaking(tokenAddr).call();
                var totalStakingEther = math.multiply(parseInt(totalStaking),math.pow(10,-18));

                for(var j=0;j<tokenList.length;j++){
                    if(tokenList[j].address.toLowerCase()==tokenAddr.toLowerCase()){
                        priceDollar = parseFloat(tokenList[j].price);
                    }
                }
                console.log("Token Address : " + tokenAddr + " | Staking in Ether : " + totalStakingEther + " | Price of token : " + priceDollar);
                sumTotalStaking = sumTotalStaking + math.multiply(totalStakingEther,priceDollar); 
            }
            console.log("Total Staking in Dollar : " + sumTotalStaking);
        }
        response.json({"Total Staking : ":sumTotalStaking}); 
    }
    totalStaking();
});

app.get("/ActiveStakers/:stake",function(request,response)
{
    var CohertContract;
    var FactoryContract;
    var ProxyContract;
    var cohertAddress = request.params.stake;
    var stakeNumbers =0;
    var stakeEvents = [];
    var unStakeNumbers =0;
    var UnStakeEvents = [];

    async function activeStakeNumber(){
        CohertContract = new web3.eth.Contract(cohertAbi,cohertAddress);
        FactoryContract = new web3.eth.Contract(factoryAbi,'0xB558C3c7Af7F1d437Fe82914426a63c13c6a3a80');
        const proxyAddr = await FactoryContract.methods.unStakeHandlers(cohertAddress).call();
        ProxyContract = new web3.eth.Contract(proxyAbi,proxyAddr);

        stakeEvents = await CohertContract.getPastEvents("Stake",
        {                               
            fromBlock: 0,     
            toBlock: 'latest'        
        });
        stakeNumbers = stakeEvents.length;
        console.log("Stakes Number = " + stakeNumbers)

        UnStakeEvents = await CohertContract.getPastEvents("UnStake",
        {                               
            fromBlock: 0,     
            toBlock: 'latest'        
        });
        unStakeNumbers = UnStakeEvents.length;
        console.log("UnStakes Number in Cohert = " + UnStakeEvents.length)

        UnStakeEvents = await ProxyContract.getPastEvents("UnStake",
        {                               
            fromBlock: 0,     
            toBlock: 'latest'        
        });
        console.log("UnStakes Number in Proxy = " + UnStakeEvents.length)

        unStakeNumbers = unStakeNumbers + UnStakeEvents.length;
        console.log("Total UnStakes Number = " + unStakeNumbers)
        
        var ActiveStakeNumber = stakeNumbers-unStakeNumbers;
        console.log("Active Stakes Number = " + ActiveStakeNumber)

        response.json({"Active Staking : ":ActiveStakeNumber}); 
    }

    activeStakeNumber();

});

app.listen(port, function () {
    var datetime = new Date();
    var message = "Server runnning on Port:- " + port + "Started at :- " + datetime;
    console.log(message);
});
