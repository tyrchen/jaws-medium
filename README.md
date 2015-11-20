# jaws-medium

This project is a small composing/publishing application utilizing AWS API gateway and lambda. Anyone can read essays published, and only authenticated users can write/update/publish/unpublish his own essays.

Other dependencies of the project:

* [medium-editor](https://github.com/yabwe/medium-editor)
* [side-comments](https://github.com/aroc/side-comments)

## API definition

* /accounts/login/
    - POST: user login, will generated JWT, and send an SNS message
* /accounts/<user-slug>/
    - GET: get user profile
    - PUT/PATCH: update user profile 
* /accounts/<user-slug>/essays/
    - GET: retrieve all POSTs of a user, or retrieve parts of POSTs that meets a criteria, say: updated after a time
    - POST: create a new POST, and send out a SNS message
* /accounts/<user-slug>/essays/<essay-slug>/
    - GET: get the post
    - PATCH/PUT: update a new POST, and send out a SNS message (if user select it). Publish/unpublish is also implemented in this API
* /accounts/<user-slug>/stats/
    - GET: get overall statistics info
* /accounts/<user-slug>/stats/<essay-slug>/
    - GET: get statistics of a single essay

All the client behavior will be collected through kinesis and processed by lambda. 
