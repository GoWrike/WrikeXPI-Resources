window.onload = () => {
  // Configure Swagger UI
  window.ui = SwaggerUIBundle({
    // POINT THIS TO YOUR SPEC FILE
    url: "./xpi-openapi3.yaml", 
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIBundle.SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    // Optional: Collapse all tags by default for cleaner view
    docExpansion: 'list', 
    // Optional: Enable "Try it out" button by default
    tryItOutEnabled: true 
  });
};