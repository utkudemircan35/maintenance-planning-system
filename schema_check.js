const url = 'https://caxyxwpykyogmkzmzush.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheHl4d3B5a3lvZ21rem16dXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjE0NTEsImV4cCI6MjA5NDY5NzQ1MX0.WgFqmEDmxau5dIsQ6J4_qE7BpeJjv6aTqu4t2MZv5xA';
fetch(url).then(r=>r.json()).then(d=>{
  console.log(d);
}).catch(console.error);
