<?php
defined( 'ABSPATH' ) || exit;

function pxcode_gutenberg_nike_load_textdomain() {
  load_plugin_textdomain( 'pxcode-gutenberg-nike', false, basename( __DIR__ ) . '/languages' );
}

function pxcode_gutenberg_nike_register_block() {
  if ( ! function_exists( 'register_block_type' ) ) {
    // Gutenberg is not active.
    return;
  }

  // Register the block by passing the location of block.json to register_block_type.
  register_block_type( __DIR__ );
  
  if ( function_exists( 'wp_set_script_translations' ) ) {
    wp_set_script_translations( 'pxcode-gutenberg-nike', 'pxcode-gutenberg' );
  }
}

function pxcode_gutenberg_nike_block_assets() {
  wp_register_script( 'pxcode-posize', 'https://cdn.jsdelivr.net/gh/px2code/posize/build/v1.00.3.js', [], false, true );
  wp_register_script( 'pxcode-gutenberg-nike-inject', false, [], null, true );
  wp_localize_script(
    'pxcode-gutenberg-nike-inject',
    'nikeInject',
    ['plugInUrl' => '/wp-content/plugins/' . plugin_basename( __DIR__ ) . '/']
  );
  
  wp_enqueue_script( 'pxcode-posize' );    
  wp_enqueue_script( 'pxcode-gutenberg-nike-inject' );    
}

add_action( 'enqueue_block_assets', 'pxcode_gutenberg_nike_block_assets' );
add_action( 'enqueue_block_editor_assets', 'pxcode_gutenberg_nike_block_assets' );

add_action( 'init', 'pxcode_gutenberg_nike_load_textdomain' );
add_action( 'init', 'pxcode_gutenberg_nike_register_block' );


    