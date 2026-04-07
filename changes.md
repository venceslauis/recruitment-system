**Fixes to be made:**



* The weightage given by the recruiter should not be visible to candidate at any cost. -- **(Integrity weightage)**
* The format of resume should not restrict to .jpg or .jpeg format - Include PDF format

Make sure candidate can upload resumes in both pdf and image format. Include Pdf parser.

* Job Title and full Job description given by the recruiter should be visible to the candidate while searching for job.





**As of now:**



Job title matches when search bar is used.

Job description --> goes to model.



along with the skills required keywords given by the recruiter while posting the job should go to model.

The weightage for the skill goes to Backend.



If the integrity check is enabled then recruiter can add additional questions in the form for initial scrutinizing process.  

&#x20;Candidate's answer to the question goes to the --> **ML model** and the model performs sematic check with that of the job description provided. The sematic score goes to Backend as usual. 



**Additionally, include Certification/Proof weightage which can be given by the recruiter along with other weightage out of 100 while posting the job.**

**Also ask for the number of certificate/proof is expected from the candidate side.** 



Total weight == 100



**OCR usage:**



**Make use of the OCR tool for extracting text from resume and automatically fill the respective details in the form by parsing the resume. The text should be extracted from pdf and also from images. Candidate can edit the text extracted from the resume in the form fields.** 



**Candidate form must contain:**



1. Name
2. E-mail
3. Phone 
4. Age
5. Eligibility check.... leave it as it is.



Add -> 1. 'Skill' section, 2. 'Projects' section, 3. 'Internship' section



The form contains Additional Certification/proof section for candidate to upload files from his system. 

And then integrity questions if recruiter opt in for.



**The certificate upload column:**



User can upload the certificate either pdf or image or docs is allowed.

I want the text should be extracted from the certificate. **The Name and Certificate Title**



**Here's the flow if a candidate uploads a certificate then the certificate is parsed and the text should fit in the given field for that particular certificate.**

**And if he/she uploads another certificate then the Name and Title should parse and sits in a separate text field row which contains *NAME and TITLE* in the same certificate upload section.**



### **Backend certificate verification:**



In the Backend, it should check whether the name in the each of the certificate (NAME field) is same as the name given by the candidate first.



*Certificate\_Name == candidate\_name   --------- (1)*



And the title of the certificate in the 'Certificate title row' goes to ML model for sematic check and the sematic score is compared and computed with the Job domain and title of the job. If the sematic score is above 0.5 then The certificate or proof is considered. 



*title\_of\_certificate\_score >= 0.5 similar to job domain  ----------- (2)*



##### **The weightage computation:**



**In the backend, also the final score is calculated.** 



Listen to this approach for weightage computation carefully. *certification or proof weight given by the recruiter* **divided by** *No. of expected proof given by the recruiter* **which is equals to** weight for each certificate. *(cert\_weight)*



There are **three criteria's** in which the certificate is flagged as 'true' for weightage computation.

1. The name in the certificate should match the candidate name in the given form application. (1)
2. The sematic similarity of the certificate title should be equal to or greater than 0.5 out of 1.0 (2)
3. The blockchain tech is used for liable certificate verification. If the hash in the given certificate and the private ledger matches then it returns blockchain status as verified in the backend. -- We'll be doing this later after blockchain deployment. For now don't worry bout it.  (3)



If (1) (2) and (3) are satisfied. Then compute the weightage for each satisfying proof. *(cert\_weight)*



Let *k=0*, inside the if statement compute *k=k+cert\_weight. If k==certificate or proof weight given by the recruiter then **stop the score computation** else <b>continue with score computation</b>*

The candidate can upload as many proof as he wanted. But the score or weightage depends on the no. of verified certificates expected form the recruiter side.



If the candidate uploads more than the required no. of verified proof then the backend should compute the score for only the required proof and other certificates is considered but the score will not generate for them.



*Final\_Score = (sematic\_score \* weight\_given) + (sematic\_score \* weight\_given) + ..... + k*

