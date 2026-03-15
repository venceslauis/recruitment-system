function calculateMatchScore(candidateSkills, jobSkills){

if(!jobSkills || jobSkills.length === 0) return 0;

let matched = 0;

jobSkills.forEach(skill=>{

if(candidateSkills.includes(skill.toLowerCase())){
matched++;
}

});

const score = Math.round((matched / jobSkills.length) * 100);

return score;

}

module.exports = calculateMatchScore;