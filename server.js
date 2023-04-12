const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

/**
 * Class for setting up the view engine
 * @class
 */
class ViewEngine {
  constructor() {
    this.handlebars = require('express-handlebars');
    this.app = app;
    this.viewsDirectory = __dirname + '/views';
    this.defaultLayout = false;
    this.extension = '.hbs';
  }

  /**
   * Setup handlebars engine for rendering views
   * @method
   */
  setupEngine() {
    this.app.engine('handlebars', this.handlebars.engine({
      extname: this.extension,
      defaultLayout: this.defaultLayout,
      layoutsDir: this.viewsDirectory
    }));
    this.app.set('view engine', 'handlebars');
  }
}

/**
 * Class for serving static files
 * @class
 */
class StaticFileServer {
  constructor() {
    this.app = app;
    this.staticDirectory = 'assets';
  }

  /**
   * Serve static files
   * @method
   */
  serve() {
    this.app.use(express.static(this.staticDirectory));
  }
}

/**
 * Class for handling the index route
 * @class
 */
class IndexRoute {
  constructor(data) {
    this.data = data;
    this.router = express.Router();
    this.view = 'index';
  }

  /**
   * Register the index route
   * @method
   * @returns {Object} - The router object
   */
  register() {
    this.router.get('/', (req, res) => {
      res.render(this.view, { data: this.data });
    });
    return this.router;
  }
}

/**
 * Class for handling the form submission route
 * @class
 */
class FormSubmitRoute {
  constructor() {
    this.router = express.Router();
    this.view = 'thankyou';
    this.csvFilePath = 'form-submissions.csv';
    this.csvHeaders = ['fullName', 'email', 'message', 'timestamp'];
  }

  /**
   * Register the form submission route
   * @method
   * @returns {Object} - The router object
   */
  register() {
    this.router.post('/submit-form', (req, res) => {
      const formData = {
        fullName: req.body.fullname,
        email: req.body.email,
        message: req.body.message,
        timestamp: new Date().toISOString()
      };
      
      const csvLine = this.csvHeaders.map(header => formData[header]).join(',');
      
      fs.appendFile(this.csvFilePath, csvLine + '\n', (err) => {
        if (err) {
          console.error(err);
        }
      });
      
      res.render(this.view);
    });
  
    return this.router;
  }
}

/**
 * Class for handling errors
 * @class
 */
class ErrorHandler {
  constructor() {
    this.app = app;
  }

  /**
   * Handle errors and return an error page
   * @method
   */
  handle() {
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).render('error');
    });
  }
}

/**
 * Class for starting the server
 * @class
 */
class Server {
  constructor(port) {
    this.app = app;
    this.port = port;
  }

  /**
   * Start the server and listen on the specified port
   * @method
   */
  start() {
    this.app.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
  }
}

const data = require('./data.json');
const viewEngine = new ViewEngine();
const staticFileServer = new StaticFileServer();
const indexRoute = new IndexRoute(data);
const formSubmitRoute = new FormSubmitRoute();
const errorHandler = new ErrorHandler();
const server = new Server(port);

viewEngine.setupEngine();
staticFileServer.serve();

app.use('/', indexRoute.register());
app.use('/', formSubmitRoute.register());

errorHandler.handle();
server.start();
