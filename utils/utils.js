module.exports = getRandomInterval() 
{
    const random=Math.random();
    
    // CALCULATE THE RANGE OF THE VALUES
    const range=120-45;

    // CALCULATE THE RANDOME INTERVAL WITHIN THE RANGE 
    const interval =Math.floor(random*range)+45;
    return interval*1000;
}
