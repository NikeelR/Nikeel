<?php
  
/**
 * Plugin Name: pxCode Gutenberg 6234357fc9e11200133195a3
 * Plugin URI: https://www.pxcode.io
 * Description: This source code is exported from pxCode, you can get more document from our website.
 * Version: 1.0.0.1647588934140
 * Author: pxCode Team
 * Author URI: https://www.pxcode.io
 * @package pxcode-gutenberg-6234357fc9e11200133195a3
 * @version 1.0.0
 */
 
defined( 'ABSPATH' ) || exit;

function assetUrl2localFileName( $str ) {
    preg_match( "/[0-9a-f]{32}/", $str, $matches ); 
    if(count( $matches ) > 0) {
        if (preg_match( "/.png/", $str ) !== -1) {
            return $matches[0] . '.png';
          } else if (preg_match( "/.jpeg/", $str ) !== -1) {
            return $matches[0] . '.jpeg';
          } else if (preg_match( "/.svg/", $str ) !== -1) {
            return $matches[0] . '.svg';
          }
    }

    return "missing";
}

function sync_block( WP_REST_Request $request ) {
    $params = $request->get_params();
    $response = wp_remote_get('https://www.pxcode.io/api/v1/generator/remote?pid=' . $params["pid"] . '&cid=' . $params["cid"] . '&platform=gutenberg&optimize=true&propsFallback=false'); 
    if( is_wp_error( $response ) ) {
        return false;
    }
    
    $body = json_decode($response['body']);

    foreach ($body->assets as $value) {
        $fileTarget = __DIR__ . '/' . $params['name']. '/assets/' . assetUrl2localFileName($value);
        if(!file_exists( $fileTarget )) {
            file_put_contents($fileTarget, fopen($value, 'r'));
        }
    }
      
    return new WP_REST_Response($body, 200);
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'pxcode/v1', '/sync/(?P<pid>[a-f0-9]+)/(?P<cid>[a-f0-9]+)/(?P<name>\w+)', array(
        'methods' => 'GET',
        'callback' => 'sync_block',
        'permission_callback' => '__return_true'
        ) );
});

include 'Nike/index.php';
  