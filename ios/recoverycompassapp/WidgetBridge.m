#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, NSObject)
RCT_EXTERN_METHOD(reloadAllTimelines)
RCT_EXTERN_METHOD(reloadTimelines:(NSString *)kind)
RCT_EXTERN_METHOD(readSharedWidgetData:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end

@interface RCT_EXTERN_MODULE(PrivacyProtection, NSObject)
RCT_EXTERN_METHOD(setEnabled:(BOOL)enabled)
@end
