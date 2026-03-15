// quick test script to fetch courses
import fetch from 'node-fetch';
(async ()=>{
    try{
        const res = await fetch('http://localhost:5001/api/courses');
        const data = await res.json();
        console.log('courses', data);
    } catch(e){
        console.error('error', e);
    }
})();