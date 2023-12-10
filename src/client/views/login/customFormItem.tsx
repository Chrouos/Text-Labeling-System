import React from 'react';
import { Form, Input } from 'antd';
import { Rule } from 'antd/lib/form';

interface CustomFormItemProps {
  label: string;
  name: string;
  rules: Rule[];
  inputType?: 'text' | 'password';
}

const CustomFormItem: React.FC<CustomFormItemProps> = ({ label, name, rules, inputType = 'text' }) => {
  return (
    <Form.Item label={label} name={name} rules={rules} className='customFormItemLabel'>
      {inputType === 'password' ? <Input.Password className='customFormItemInput' /> : <Input className='customFormItemInput'/>}
    </Form.Item>
  );
};

export default CustomFormItem;
