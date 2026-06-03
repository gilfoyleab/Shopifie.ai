async function test() {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Buy a cheap macbook air m1" }]
    })
  });
  
  const text = await res.text();
  console.log("RESPONSE:", text);
}
test();
