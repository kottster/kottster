window.aaibSettings = {
  id: "2b219452-ea39-4b74-80f9-f0e64553b1c3",
};

const localSearchElement = document.getElementById('local-search');   
if (localSearchElement && localSearchElement.parentNode) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const newDiv = document.createElement('div');
  newDiv.className = `aaib ${isDarkMode ? 'aaib-dark' : 'aaib-light'}`;
  newDiv.style.marginLeft = '12px';
  
  localSearchElement.parentNode.insertBefore(newDiv, localSearchElement.nextSibling);
}