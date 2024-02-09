
## Instruções gerais para executar o projeto localmente 
## Powered by Novakio to Casa Di Conti. 
## Dt. elaboração: 24/09/2023.

- Para rodar o projeto localmente - com Docker
  Utilizar o arquivo Dockerfile na raiz do projeto para dar up no projeto. 

  O volume será setado com a própria pasta do projeto, para evitar que tenha que se buildar o projeto em toda alteração. 

- Entrar na pasta raiz do projeto

- Executar os seguintes comandos: 
  docker build -t miv:backend . (buildar imagem do projeto para docker)
  docker images (conferir se está tudo ok)
  docker run -p 3333:3333 miv:backend (iniciar o container/serviço)

## Sempre verificar se não há nenhum serviço rodando na porta que você irá executar. 




















Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains over 2000 video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

