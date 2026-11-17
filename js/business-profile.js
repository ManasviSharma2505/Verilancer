const API_BASE = "http://localhost:5001/api";
const user = JSON.parse(localStorage.getItem("verilancerUser") || "null");
const loggedIn = localStorage.getItem("verilancerLoggedIn") === "true";
if (!user?.id || !loggedIn) location.href = "login.html";
const $ = id => document.getElementById(id);
const fields = {name:$("businessName"),industry:$("businessIndustry"),about:$("businessAbout"),website:$("businessWebsite"),phone:$("businessPhone")};
async function loadBusiness(){
 try{
  const response=await fetch(API_BASE+"/profile/"+user.id);
  if(!response.ok) throw new Error("Could not load business profile.");
  const data=await response.json();
  if(data.role!=="client"){location.replace("profile.html");return;}
  fields.name.value=data.name||user.name||"";
  fields.industry.value=data.headline||"";
  fields.about.value=data.bio||"";
  fields.website.value=data.portfolio||"";
  fields.phone.value=data.phone||"";
 }catch(error){$("businessStatus").textContent=error.message;$("businessStatus").style.color="#c0392b";}
}
$("businessForm").addEventListener("submit",async event=>{
 event.preventDefault();
 const button=$("saveBusiness");button.disabled=true;button.textContent="Saving...";
 try{
  const response=await fetch(API_BASE+"/profile/"+user.id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   name:fields.name.value.trim(),headline:fields.industry.value.trim(),bio:fields.about.value.trim(),portfolio:fields.website.value.trim(),phone:fields.phone.value.trim(),
   skills:"",location:"",experience:"",education:"",certifications:"",availability:""
  })});
  const result=await response.json();if(!response.ok)throw new Error(result.message||"Unable to save profile.");
  user.name=fields.name.value.trim();localStorage.setItem("verilancerUser",JSON.stringify(user));
  $("businessStatus").textContent="Business profile saved successfully.";$("businessStatus").style.color="#16803c";preview();
 }catch(error){$("businessStatus").textContent=error.message;$("businessStatus").style.color="#c0392b";}
 finally{button.disabled=false;button.textContent="Save profile";}
});
loadBusiness();