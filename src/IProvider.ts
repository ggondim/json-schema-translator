interface IProvider {
  getValue: IProviderGetValueFn;
}

interface IProviderGetValueFn {
  ({
    sourceKey: string,
    sourceObject: object,
    currentValue: any,
    translation: object,
    targetSchema: object,
    _utils: any }): Promise<object>;
}