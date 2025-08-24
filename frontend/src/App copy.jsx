// import "./App.css";
// import Header from "./components/Header";
// import Navbar from "./components/Navbar";
// import DashboardContent from "./components/DashboardContent";
// import Breadcrumbs from "./components/Breadcrumbs";
// import MobileMenu from "./components/MobileMenu";
// /*
//   This example requires some changes to your config:

//   ```
//   // tailwind.config.js
//   module.exports = {
//     // ...
//     plugins: [
//       // ...
//       require('@tailwindcss/forms'),
//     ],
//   }
//   ```
// */
// import { useState } from "react";
// import {
//   CalendarIcon,
//   ChartBarIcon,
//   FolderIcon,
//   HomeIcon,
//   InboxIcon,
//   UsersIcon,
// } from "@heroicons/react/24/outline";

// const navigation = [
//   { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
//   { name: "Team", href: "#", icon: UsersIcon, current: false },
//   { name: "Projects", href: "#", icon: FolderIcon, current: false },
//   { name: "Calendar", href: "#", icon: CalendarIcon, current: false },
//   { name: "Documents", href: "#", icon: InboxIcon, current: false },
//   { name: "Reports", href: "#", icon: ChartBarIcon, current: false },
// ];

// function App() {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="app">
//       {/*
//         This example requires updating your template:

//         ```
//         <html class="h-full bg-gray-100">
//         <body class="h-full">
//         ```
//       */}
//       <div>
//         <MobileMenu
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           navigation={navigation}
//         />

//         {/* Static sidebar for desktop */}
//         <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
//           {/* Sidebar component, swap this element with another sidebar if you like */}
//           <Navbar navigation={navigation} />
//         </div>
//         <div className="flex flex-col md:pl-64">
//           <Header setSidebarOpen={setSidebarOpen} />

//           <main className="flex-1">
//             <div className="py-6">
//               <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
//                 <Breadcrumbs />
//               </div>
//               <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
//                 {/* Replace with your content */}
//                 <DashboardContent />
//                 {/* /End replace */}
//               </div>
//             </div>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please upload a file");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:3000/api/resume/parse", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Resume Parser Test</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h2>Parsed Result</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
